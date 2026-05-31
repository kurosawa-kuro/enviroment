from fastapi import FastAPI

from micropost_api.db import init_db
from micropost_api.gcp_logging import RequestLoggingMiddleware, configure_logging
from micropost_api.web.routes import router


def create_app() -> FastAPI:
    init_db()

    logger = configure_logging("micropost-api")
    api = FastAPI(title="Micropost CRUD")
    api.add_middleware(RequestLoggingMiddleware, logger=logger)
    api.include_router(router)
    return api


app = create_app()
