# we support images for building with a vanilla SteamOS base,
# or versions with ootb support for rust or go
# developers can also customize these images via this Dockerfile
#FROM ghcr.io/steamdeckhomebrew/holo-toolchain-rust:latest
#FROM ghcr.io/steamdeckhomebrew/holo-toolchain-go:latest
FROM ghcr.io/steamdeckhomebrew/holo-base:latest

RUN pacman --noconfirm -Syy wget sudo unzip patchelf; pacman -Scc

RUN useradd --create-home gradle
RUN groupadd sudo
RUN usermod -aG sudo gradle
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> \
/etc/sudoers
RUN touch /.dockerenv

# Configure the environment
USER gradle

RUN mkdir -p $HOME/graalvm
RUN pushd $HOME/graalvm \
    && wget https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-22.3.1/graalvm-ce-java19-linux-amd64-22.3.1.tar.gz \
    && tar xvzf graalvm-ce-java19-linux-amd64-22.3.1.tar.gz \
    && rm graalvm-ce-java19-linux-amd64-22.3.1.tar.gz \
    && popd

RUN pushd $HOME/graalvm \
    && wget https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-22.3.1/native-image-installable-svm-java19-linux-amd64-22.3.1.jar \
    && pushd graalvm-ce-java19-22.3.1 \
    && unzip -n ../native-image-installable-svm-java19-linux-amd64-22.3.1.jar \
    && pushd bin \
    && ln -s ../lib/svm/bin/native-image native-image \
    && ln -s ../lib/svm/bin/native-image-configure native-image-configure \
    && ln -s ../lib/svm/bin/rebuild-images rebuild-images \
    && chmod 777 native-image native-image-configure rebuild-images \
    && popd && popd \
    && rm native-image-installable-svm-java19-linux-amd64-22.3.1.jar \
    && popd

ENV HOME /home/gradle
#ENV PATH $PATH:/usr/lib/jvm/java-19-openjdk/bin
ENV PATH $PATH:$HOME/graalvm/graalvm-ce-java19-22.3.1/bin
#ENV JAVA_HOME /usr/lib/jvm/java-19-openjdk
ENV JAVA_HOME $HOME/graalvm/graalvm-ce-java19-22.3.1
#RUN mkdir -p /root/.konan/dependencies
#RUN pushd /root/.konan/dependencies \
#    && wget https://download.jetbrains.com/kotlin/native/x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2.tar.gz  \
#    && tar xvzf x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2.tar.gz \
#    && rm x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2.tar.gz \
#    && popd
#RUN pushd /root/.konan/dependencies \
#    && wget https://download.jetbrains.com/kotlin/native/lldb-4-linux.tar.gz \
#    && tar xvzf lldb-4-linux.tar.gz \
#    && rm lldb-4-linux.tar.gz \
#    && popd
#RUN pushd /root/.konan/dependencies \
#    && wget https://download.jetbrains.com/kotlin/native/llvm-11.1.0-linux-x64-essentials.tar.gz \
#    && tar xvzf llvm-11.1.0-linux-x64-essentials.tar.gz \
#    && rm llvm-11.1.0-linux-x64-essentials.tar.gz \
#    && popd
#RUN pushd /root/.konan/dependencies \
#    && wget https://download.jetbrains.com/kotlin/native/libffi-3.2.1-2-linux-x86-64.tar.gz \
#    && tar xvzf libffi-3.2.1-2-linux-x86-64.tar.gz \
#    && rm libffi-3.2.1-2-linux-x86-64.tar.gz \
#    && popd
#RUN pushd /root/.konan \
#    && wget https://download.jetbrains.com/kotlin/native/builds/releases/1.9.0/linux-x86_64/kotlin-native-prebuilt-linux-x86_64-1.9.0.tar.gz \
#    && tar xvzf kotlin-native-prebuilt-linux-x86_64-1.9.0.tar.gz \
#    && rm kotlin-native-prebuilt-linux-x86_64-1.9.0.tar.gz \
#    && popd
#RUN pushd /root/.konan/dependencies \
##    && pushd x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2/x86_64-unknown-linux-gnu/sysroot \
##    && pushd lib \
##    && mv libcrypt.so.1 libcrypt.so.2 \
##    && popd \
##    && pushd usr/lib \
##    && ln -sf ../../lib/libcrypt.so.2 libcrypt.so \
##    && popd \
##    && popd \
#    && echo "x86_64-unknown-linux-gnu-gcc-8.3.0-glibc-2.19-kernel-4.9-2" >> .extracted \
#    && echo "lldb-4-linux" >> .extracted \
#    && echo "llvm-11.1.0-linux-x64-essentials" >> .extracted \
#    && echo "libffi-3.2.1-2-linux-x86-64" >> .extracted \
#    && popd

WORKDIR /backend

# entrypoint.sh should always be located in the backend folder
ENTRYPOINT [ "/backend/entrypoint.sh" ]