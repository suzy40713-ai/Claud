import asyncio

from app.queue_consumer import run_worker

if __name__ == "__main__":
    asyncio.run(run_worker())
