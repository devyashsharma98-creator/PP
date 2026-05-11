cmake_minimum_required(VERSION 3.16)
project(PragyaPravah VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 选项：启用gRPC服务
option(BUILD_GRPC_SERVICE "Build gRPC C++ service" ON)
option(USE_FETCH_GRPC "Fetch gRPC via CMake FetchContent" OFF)

# 查找包
find_package(Eigen3 3.3 REQUIRED NO_MODULE)
find_package(Threads REQUIRED)

# 源文件
set(SIGNAL_SOURCES
    src/SignalGenerator.cpp
    src/SignalAnalyzer.cpp
    src/PDWExtractor.cpp
    src/EmitterDatabase.cpp
    src/ThreatAssessor.cpp
    src/Utils.cpp
)

set(SIGNAL_HEADERS
    include/SignalGenerator.hpp
    include/SignalAnalyzer.hpp
    include/PDWExtractor.hpp
    include/EmitterDatabase.hpp
    include/ThreatAssessor.hpp
    include/Utils.hpp
)

# 主可执行文件
add_executable(${PROJECT_NAME}
    src/main.cpp
    ${SIGNAL_SOURCES}
    ${SIGNAL_HEADERS}
)

target_link_libraries(${PROJECT_NAME} PRIVATE
    Eigen3::Eigen
    Threads::Threads
)

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# gRPC服务构建
if(BUILD_GRPC_SERVICE)
    if(USE_FETCH_GRPC)
        include(FetchContent)
        FetchContent_Declare(
            gRPC
            GIT_REPOSITORY https://github.com/grpc/grpc.git
            GIT_TAG v1.70.0
            GIT_SHALLOW TRUE
            GIT_PROGRESS TRUE
        )
        set(gRPC_ABSL_PROVIDER module)
        set(gRPC_PROTOBUF_PROVIDER module)
        set(gRPC_SSL_PROVIDER module)
        set(gRPC_BUILD_TESTS OFF)
        set(gRPC_BUILD_CSHARP_EXT OFF)
        FetchContent_MakeAvailable(gRPC)
    else()
        find_package(Protobuf CONFIG QUIET)
        find_package(gRPC CONFIG QUIET)
        
        if(NOT Protobuf_FOUND OR NOT gRPC_FOUND)
            message(WARNING "gRPC not found. Please install gRPC or set USE_FETCH_GRPC=ON")
            message(STATUS "  Windows: vcpkg install grpc:x64-windows")
            message(STATUS "  Linux:   sudo apt install libgrpc++-dev protobuf-compiler-grpc")
            set(BUILD_GRPC_SERVICE OFF)
        endif()
    endif()
    
    if(BUILD_GRPC_SERVICE AND (USE_FETCH_GRPC OR (Protobuf_FOUND AND gRPC_FOUND)))
        # Proto文件
        set(PROTO_FILE ${CMAKE_CURRENT_SOURCE_DIR}/proto/signal_simulation.proto)
        set(PROTO_OUT_DIR ${CMAKE_CURRENT_BINARY_DIR}/generated)
        file(MAKE_DIRECTORY ${PROTO_OUT_DIR})
        
        if(USE_FETCH_GRPC)
            set(PROTOC_EXECUTABLE $<TARGET_FILE:protoc>)
            set(GRPC_CPP_PLUGIN $<TARGET_FILE:grpc_cpp_plugin>)
        else()
            find_program(PROTOC_EXECUTABLE protoc REQUIRED)
            find_program(GRPC_CPP_PLUGIN grpc_cpp_plugin REQUIRED)
        endif()
        
        # 生成Protobuf和gRPC代码
        add_custom_command(
            OUTPUT 
                ${PROTO_OUT_DIR}/signal_simulation.pb.cc
                ${PROTO_OUT_DIR}/signal_simulation.pb.h
                ${PROTO_OUT_DIR}/signal_simulation.grpc.pb.cc
                ${PROTO_OUT_DIR}/signal_simulation.grpc.pb.h
            COMMAND ${PROTOC_EXECUTABLE}
                --proto_path=${CMAKE_CURRENT_SOURCE_DIR}/proto
                --cpp_out=${PROTO_OUT_DIR}
                --grpc_out=${PROTO_OUT_DIR}
                --plugin=protoc-gen-grpc=${GRPC_CPP_PLUGIN}
                ${PROTO_FILE}
            DEPENDS ${PROTO_FILE}
            COMMENT "Generating gRPC C++ code from ${PROTO_FILE}"
        )
        
        set(PROTO_GENERATED
            ${PROTO_OUT_DIR}/signal_simulation.pb.cc
            ${PROTO_OUT_DIR}/signal_simulation.pb.h
            ${PROTO_OUT_DIR}/signal_simulation.grpc.pb.cc
            ${PROTO_OUT_DIR}/signal_simulation.grpc.pb.h
        )
        
        # gRPC服务端可执行文件
        add_executable(${PROJECT_NAME}_grpc
            src/grpc_server.cpp
            ${SIGNAL_SOURCES}
            ${PROTO_GENERATED}
        )
        
        if(USE_FETCH_GRPC)
            target_link_libraries(${PROJECT_NAME}_grpc PRIVATE
                grpc++
                protobuf::libprotobuf
                Eigen3::Eigen
                Threads::Threads
            )
        else()
            target_link_libraries(${PROJECT_NAME}_grpc PRIVATE
                gRPC::grpc++
                protobuf::libprotobuf
                Eigen3::Eigen
                Threads::Threads
            )
        endif()
        
        target_include_directories(${PROJECT_NAME}_grpc PRIVATE
            ${CMAKE_CURRENT_SOURCE_DIR}/include
            ${PROTO_OUT_DIR}
        )
        
        message(STATUS "gRPC service enabled: ${PROJECT_NAME}_grpc")
    endif()
endif()

# 测试
enable_testing()
add_test(NAME SignalGeneratorTest COMMAND ${PROJECT_NAME} 1000e6 1e-6 10)
