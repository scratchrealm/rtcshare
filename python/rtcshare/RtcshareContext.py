from typing import Tuple


class RtcshareService:
    def handle_query(query: dict, *, dir: str) -> Tuple[dict, bytes]:
        raise NotImplementedError()

class RtcshareContext:
    def __init__(self) -> None:
        self._services = {}
    def register_service(self, name: str, service: RtcshareService):
        self._services[name] = service
    def handle_query(self, service_name, query: dict, *, dir: str) -> Tuple[dict, bytes]:
        if service_name not in self._services:
            raise Exception(f'No such service: {service_name}')
        return self._services[service_name].handle_query(query, dir=dir)