# we support images for building with a vanilla SteamOS base,
# or versions with ootb support for rust or go
# developers can also customize these images via this Dockerfile
#FROM ghcr.io/steamdeckhomebrew/holo-toolchain-rust:latest
#FROM ghcr.io/steamdeckhomebrew/holo-toolchain-go:latest
FROM ghcr.io/steamdeckhomebrew/holo-base:latest

RUN pacman --noconfirm -Syy jdk19-openjdk wget patchelf; pacman -Scc

RUN mkdir /home/gradle \
    && chown --recursive 1000:1000 /home/gradle

# Configure the environment
ENV PATH $PATH:/usr/lib/jvm/java-19-openjdk/bin
ENV JAVA_HOME /usr/lib/jvm/java-19-openjdk
ENV HOME /home/gradle

RUN mkdir -p /root/.konan/dependencies
RUN pushd /root/.konan/dependencies \
    && wget https://download.jetbrains.com/kotlin/native/x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2.tar.gz  \
    && tar xvzf x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2.tar.gz \
    && rm x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2.tar.gz \
    && popd
RUN pushd /root/.konan/dependencies \
    && wget https://download.jetbrains.com/kotlin/native/lldb-4-linux.tar.gz \
    && tar xvzf lldb-4-linux.tar.gz \
    && rm lldb-4-linux.tar.gz \
    && popd
RUN pushd /root/.konan/dependencies \
    && wget https://download.jetbrains.com/kotlin/native/llvm-11.1.0-linux-x64-essentials.tar.gz \
    && tar xvzf llvm-11.1.0-linux-x64-essentials.tar.gz \
    && rm llvm-11.1.0-linux-x64-essentials.tar.gz \
    && popd
RUN pushd /root/.konan/dependencies \
    && wget https://download.jetbrains.com/kotlin/native/libffi-3.2.1-2-linux-x86-64.tar.gz \
    && tar xvzf libffi-3.2.1-2-linux-x86-64.tar.gz \
    && rm libffi-3.2.1-2-linux-x86-64.tar.gz \
    && popd
RUN pushd /root/.konan \
    && wget https://download.jetbrains.com/kotlin/native/builds/releases/1.9.0/linux-x86_64/kotlin-native-prebuilt-linux-x86_64-1.9.0.tar.gz \
    && tar xvzf kotlin-native-prebuilt-linux-x86_64-1.9.0.tar.gz \
    && rm kotlin-native-prebuilt-linux-x86_64-1.9.0.tar.gz \
    && popd
RUN pushd /root/.konan/dependencies \
#    && pushd x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2/x86_64-unknown-linux-gnu/sysroot \
#    && pushd lib \
#    && mv libcrypt.so.1 libcrypt.so.2 \
#    && popd \
#    && pushd usr/lib \
#    && ln -sf ../../lib/libcrypt.so.2 libcrypt.so \
#    && popd \
#    && popd \
    && echo "x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2" >> .extracted \
    && echo "lldb-4-linux" >> .extracted \
    && echo "llvm-11.1.0-linux-x64-essentials" >> .extracted \
    && echo "libffi-3.2.1-2-linux-x86-64" >> .extracted \
    && popd

RUN touch /.dockerenv

WORKDIR /backend

# entrypoint.sh should always be located in the backend folder
ENTRYPOINT [ "/backend/entrypoint.sh" ]