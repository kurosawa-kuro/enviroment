import os
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

import httpx
import pytest

API_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = API_DIR / "src"


@dataclass
class LiveServer:
    base_url: str
    db_path: Path


def _find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _wait_for_ready(url: str, timeout: float = 20.0) -> None:
    deadline = time.monotonic() + timeout
    last_err: Exception | None = None
    while time.monotonic() < deadline:
        try:
            if httpx.get(url, timeout=1.0).status_code == 200:
                return
        except Exception as exc:
            last_err = exc
        time.sleep(0.2)
    raise RuntimeError(f"server at {url} did not become ready: {last_err}")


@pytest.fixture(scope="session")
def live_server():
    """Spin up uvicorn on a free port with an isolated temp SQLite DB."""
    port = _find_free_port()
    tmp = tempfile.TemporaryDirectory(prefix="micropost-e2e-")
    db_path = Path(tmp.name) / "e2e.db"

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path}"
    env["PYTHONPATH"] = str(SRC_DIR) + os.pathsep + env.get("PYTHONPATH", "")
    env["PYTHONUNBUFFERED"] = "1"

    proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "micropost_api.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
            "--log-level",
            "warning",
        ],
        cwd=str(API_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    base_url = f"http://127.0.0.1:{port}"
    try:
        _wait_for_ready(f"{base_url}/healthz")
        yield LiveServer(base_url=base_url, db_path=db_path)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
        tmp.cleanup()


@pytest.fixture(autouse=True)
def _clean_db(live_server: LiveServer):
    """Wipe the microposts table before each test for order-independence."""
    if live_server.db_path.exists():
        with sqlite3.connect(live_server.db_path) as conn:
            conn.execute("DELETE FROM microposts")
            has_seq = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'"
            ).fetchone()
            if has_seq:
                conn.execute("DELETE FROM sqlite_sequence WHERE name='microposts'")
            conn.commit()
    yield


@pytest.fixture
def app_url(live_server: LiveServer) -> str:
    return live_server.base_url
