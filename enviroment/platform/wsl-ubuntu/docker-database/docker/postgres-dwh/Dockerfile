FROM postgres:13

RUN apt-get update && \
    apt-get install -y \
    postgresql-server-dev-13 \
    clang \
    cmake \
    git \
    make \
    libprotobuf-c-dev \
    protobuf-c-compiler && \
    git clone https://github.com/citusdata/cstore_fdw.git && \
    cd cstore_fdw && make && make install

RUN echo "shared_preload_libraries = 'cstore_fdw'" >> /usr/share/postgresql/postgresql.conf.sample