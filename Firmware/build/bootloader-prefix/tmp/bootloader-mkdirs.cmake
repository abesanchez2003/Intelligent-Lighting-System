# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION 3.5)

file(MAKE_DIRECTORY
  "/Users/abe/esp/esp-idf/components/bootloader/subproject"
  "/Users/abe/capstone/Intelligent-Lighting-System/Firmware/build/bootloader"
  "/Users/abe/capstone/Intelligent-Lighting-System/Firmware/build/bootloader-prefix"
  "/Users/abe/capstone/Intelligent-Lighting-System/Firmware/build/bootloader-prefix/tmp"
  "/Users/abe/capstone/Intelligent-Lighting-System/Firmware/build/bootloader-prefix/src/bootloader-stamp"
  "/Users/abe/capstone/Intelligent-Lighting-System/Firmware/build/bootloader-prefix/src"
  "/Users/abe/capstone/Intelligent-Lighting-System/Firmware/build/bootloader-prefix/src/bootloader-stamp"
)

set(configSubDirs )
foreach(subDir IN LISTS configSubDirs)
    file(MAKE_DIRECTORY "/Users/abe/capstone/Intelligent-Lighting-System/Firmware/build/bootloader-prefix/src/bootloader-stamp/${subDir}")
endforeach()
