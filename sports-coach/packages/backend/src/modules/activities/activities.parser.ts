import { XMLParser } from "fast-xml-parser";
import { haversineDistanceMeters } from "../../lib/geo.js";

export interface ParsedActivity {
  date: Date;
  duree: number; // secondes
  distance: number; // metres
  denivele: number | null;
  fcMoyenne: number | null;
  raw: unknown;
}

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseGpx(xmlText: string): ParsedActivity {
  const doc = xmlParser.parse(xmlText);
  const tracks = asArray(doc?.gpx?.trk);
  const points: Array<{ lat: number; lon: number; ele: number | null; time: Date | null; hr: number | null }> = [];

  for (const track of tracks) {
    for (const segment of asArray(track?.trkseg)) {
      for (const pt of asArray(segment?.trkpt)) {
        const hrRaw =
          pt?.extensions?.["gpxtpx:TrackPointExtension"]?.["gpxtpx:hr"] ??
          pt?.extensions?.TrackPointExtension?.hr ??
          null;
        points.push({
          lat: Number(pt?.["@_lat"]),
          lon: Number(pt?.["@_lon"]),
          ele: pt?.ele !== undefined ? Number(pt.ele) : null,
          time: pt?.time ? new Date(pt.time) : null,
          hr: hrRaw !== null ? Number(hrRaw) : null,
        });
      }
    }
  }

  if (points.length < 2) {
    throw new Error("Fichier GPX invalide ou vide (pas assez de points de trace)");
  }

  let distance = 0;
  let denivele = 0;
  let hrSum = 0;
  let hrCount = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    distance += haversineDistanceMeters(prev.lat, prev.lon, curr.lat, curr.lon);
    if (prev.ele !== null && curr.ele !== null && curr.ele > prev.ele) {
      denivele += curr.ele - prev.ele;
    }
  }

  for (const p of points) {
    if (p.hr !== null && !Number.isNaN(p.hr)) {
      hrSum += p.hr;
      hrCount++;
    }
  }

  const start = points.find((p) => p.time)?.time ?? new Date();
  const end = [...points].reverse().find((p) => p.time)?.time ?? start;
  const duree = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));

  return {
    date: start,
    duree,
    distance: Math.round(distance),
    denivele: denivele > 0 ? Math.round(denivele) : null,
    fcMoyenne: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
    raw: { pointCount: points.length },
  };
}

export function parseTcx(xmlText: string): ParsedActivity {
  const doc = xmlParser.parse(xmlText);
  const activities = asArray(doc?.TrainingCenterDatabase?.Activities?.Activity);
  if (activities.length === 0) {
    throw new Error("Fichier TCX invalide (aucune activite trouvee)");
  }
  const activity = activities[0];
  const laps = asArray(activity?.Lap);
  if (laps.length === 0) {
    throw new Error("Fichier TCX invalide (aucun lap trouve)");
  }

  let duree = 0;
  let distance = 0;
  let denivele: number | null = null;
  let hrSum = 0;
  let hrCount = 0;
  let lastEle: number | null = null;

  for (const lap of laps) {
    duree += Number(lap?.TotalTimeSeconds ?? 0);
    distance += Number(lap?.DistanceMeters ?? 0);
    if (lap?.AverageHeartRateBpm?.Value !== undefined) {
      hrSum += Number(lap.AverageHeartRateBpm.Value);
      hrCount++;
    }

    for (const track of asArray(lap?.Track)) {
      for (const point of asArray(track?.Trackpoint)) {
        const ele = point?.AltitudeMeters !== undefined ? Number(point.AltitudeMeters) : null;
        if (ele !== null) {
          if (lastEle !== null && ele > lastEle) {
            denivele = (denivele ?? 0) + (ele - lastEle);
          }
          lastEle = ele;
        }
      }
    }
  }

  const date = activity?.Id ? new Date(activity.Id) : new Date();

  return {
    date,
    duree: Math.round(duree),
    distance: Math.round(distance),
    denivele: denivele !== null ? Math.round(denivele) : null,
    fcMoyenne: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
    raw: { lapCount: laps.length },
  };
}

export async function parseFit(buffer: Buffer): Promise<ParsedActivity> {
  const { default: FitParser } = await import("fit-file-parser");
  const parser = new FitParser({
    force: true,
    speedUnit: "m/s",
    lengthUnit: "m",
    temperatureUnit: "celsius",
    elapsedRecordField: true,
    mode: "list",
  });

  return new Promise((resolve, reject) => {
    parser.parse(buffer, (error: unknown, data: any) => {
      if (error) {
        reject(new Error("Fichier FIT invalide ou corrompu"));
        return;
      }

      const session = data?.sessions?.[0];
      if (!session) {
        reject(new Error("Fichier FIT invalide (aucune session trouvee)"));
        return;
      }

      resolve({
        date: session.start_time ? new Date(session.start_time) : new Date(),
        duree: Math.round(session.total_elapsed_time ?? 0),
        distance: Math.round(session.total_distance ?? 0),
        denivele:
          session.total_ascent !== undefined && session.total_ascent !== null
            ? Math.round(session.total_ascent)
            : null,
        fcMoyenne:
          session.avg_heart_rate !== undefined && session.avg_heart_rate !== null
            ? Math.round(session.avg_heart_rate)
            : null,
        raw: { recordCount: data?.records?.length ?? 0 },
      });
    });
  });
}
