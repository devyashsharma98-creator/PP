#include <iostream>
#include <memory>
#include <string>
#include <thread>
#include <chrono>
#include <atomic>

#include <grpcpp/grpcpp.h>
#include "signal_simulation.grpc.pb.h"

#include "SignalGenerator.hpp"
#include "SignalAnalyzer.hpp"
#include "PDWExtractor.hpp"
#include "EmitterDatabase.hpp"
#include "ThreatAssessor.hpp"

using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::Status;
using grpc::ServerWriter;

using signalsimulation::SignalSimulationService;
using signalsimulation::Empty;
using signalsimulation::StatusResponse;
using signalsimulation::GlobalParams;
using signalsimulation::EmitterConfig;
using signalsimulation::EmitterList;
using signalsimulation::JammingConfig;
using signalsimulation::IQData;
using signalsimulation::SpectrumData;
using signalsimulation::PDW;
using signalsimulation::PDWStream;
using signalsimulation::SubscribeRequest;
using signalsimulation::SpectrumFrame;
using signalsimulation::SceneState;
using signalsimulation::EmitterVisual;
using signalsimulation::JammingVisual;
using signalsimulation::SystemStatus;

class SignalSimulationServiceImpl final : public SignalSimulationService::Service {
private:
    // 仿真参数
    double sample_rate_ = 10e6;      // 10 MHz
    double duration_ = 100e-6;       // 100 us
    double noise_floor_db_ = -90.0;  // -90 dB
    
    // 核心组件
    SignalGenerator generator_;
    SignalAnalyzer analyzer_;
    PDWExtractor pdw_extractor_;
    EmitterDatabase emitter_db_;
    ThreatAssessor threat_assessor_;
    
    // 干扰参数
    struct JammingParams {
        std::string type = "";
        double strength = 0.0;
        double frequency = 0.0;
        double bandwidth = 0.0;
    } jamming_;
    
    std::atomic<bool> running_{false};
    
public:
    SignalSimulationServiceImpl() = default;
    
    // 设置全局参数
    Status SetGlobalParams(ServerContext* context, 
                           const GlobalParams* request,
                           StatusResponse* reply) override {
        sample_rate_ = request->sample_rate();
        duration_ = request->duration();
        noise_floor_db_ = request->noise_floor_db();
        
        generator_.setNoiseFloor(dBToLinear(noise_floor_db_));
        generator_.setSampleRate(sample_rate_);
        
        reply->set_success(true);
        reply->set_message("Global parameters updated");
        return Status::OK;
    }
    
    // 添加辐射源
    Status AddEmitter(ServerContext* context,
                      const EmitterConfig* request,
                      StatusResponse* reply) override {
        try {
            SignalParams::ModulationType mod = SignalParams::CW;
            if (request->modulation() == "CW") mod = SignalParams::CW;
            else if (request->modulation() == "PULSE") mod = SignalParams::PULSE;
            else if (request->modulation() == "LFM") mod = SignalParams::LFM;
            else if (request->modulation() == "BPSK") mod = SignalParams::BPSK;
            
            SignalParams params(
                request->frequency(),
                dBToLinear(request->amplitude()),
                sample_rate_,
                duration_,
                mod
            );
            
            params.pri = request->pri();
            params.pulseWidth = request->pulse_width();
            params.bandwidth = request->bandwidth();
            
            generator_.addEmitter(params);
            emitter_db_.addEmitter(request->name(), params);
            
            reply->set_success(true);
            reply->set_message("Emitter added: " + request->name());
        } catch (const std::exception& e) {
            reply->set_success(false);
            reply->set_message(std::string("Error: ") + e.what());
        }
        return Status::OK;
    }
    
    // 清除辐射源
    Status ClearEmitters(ServerContext* context,
                         const Empty* request,
                         StatusResponse* reply) override {
        generator_.clearEmitters();
        emitter_db_.clear();
        reply->set_success(true);
        reply->set_message("All emitters cleared");
        return Status::OK;
    }
    
    // 列出辐射源
    Status ListEmitters(ServerContext* context,
                        const Empty* request,
                        EmitterList* reply) override {
        for (const auto& [name, params] : emitter_db_.getEmitters()) {
            auto* emitter = reply->add_emitters();
            emitter->set_name(name);
            emitter->set_frequency(params.frequency);
            emitter->set_amplitude(linearTodB(params.amplitude));
            
            std::string mod_str = "CW";
            switch (params.modulation) {
                case SignalParams::CW: mod_str = "CW"; break;
                case SignalParams::PULSE: mod_str = "PULSE"; break;
                case SignalParams::LFM: mod_str = "LFM"; break;
                case SignalParams::BPSK: mod_str = "BPSK"; break;
                default: mod_str = "CW"; break;
            }
            emitter->set_modulation(mod_str);
            emitter->set_pri(params.pri);
            emitter->set_pulse_width(params.pulseWidth);
            emitter->set_bandwidth(params.bandwidth);
        }
        return Status::OK;
    }
    
    // 设置干扰
    Status SetJamming(ServerContext* context,
                      const JammingConfig* request,
                      StatusResponse* reply) override {
        jamming_.type = request->type();
        jamming_.strength = request->strength();
        jamming_.frequency = request->frequency();
        jamming_.bandwidth = request->bandwidth();
        
        generator_.clearJammers();
        
        if (jamming_.type != "NONE" && jamming_.strength > 0) {
            SignalParams jammer;
            jammer.frequency = jamming_.frequency;
            jammer.amplitude = dBToLinear(jamming_.strength);
            jammer.sampleRate = sample_rate_;
            jammer.duration = duration_;
            jammer.modulation = SignalParams::CW;
            generator_.addJammer(jammer);
        }
        
        reply->set_success(true);
        reply->set_message("Jamming configured: " + jamming_.type);
        return Status::OK;
    }
    
    // 清除干扰
    Status ClearJamming(ServerContext* context,
                        const Empty* request,
                        StatusResponse* reply) override {
        generator_.clearJammers();
        jamming_ = JammingParams{};
        reply->set_success(true);
        reply->set_message("Jamming cleared");
        return Status::OK;
    }
    
    // 生成IQ数据
    Status GenerateIQ(ServerContext* context,
                      const Empty* request,
                      IQData* reply) override {
        auto start = std::chrono::high_resolution_clock::now();
        
        generator_.generate(duration_, sample_rate_);
        const auto& iq = generator_.getIQ();
        
        for (size_t i = 0; i < iq.first.size(); ++i) {
            reply->add_i_samples(iq.first[i]);
            reply->add_q_samples(iq.second[i]);
        }
        reply->set_sample_count(iq.first.size());
        reply->set_sample_rate(sample_rate_);
        
        auto end = std::chrono::high_resolution_clock::now();
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
        
        return Status::OK;
    }
    
    // 生成频谱数据
    Status GenerateSpectrum(ServerContext* context,
                            const Empty* request,
                            SpectrumData* reply) override {
        auto start = std::chrono::high_resolution_clock::now();
        
        generator_.generate(duration_, sample_rate_);
        analyzer_.analyze(generator_.getIQ(), sample_rate_);
        
        const auto& freqs = analyzer_.getFrequencies();
        const auto& amps = analyzer_.getAmplitudes();
        
        for (double f : freqs) reply->add_frequencies(f);
        for (double a : amps) reply->add_amplitudes(a);
        reply->set_resolution(sample_rate_ / freqs.size());
        
        auto end = std::chrono::high_resolution_clock::now();
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
        
        return Status::OK;
    }
    
    // 生成PDW
    Status GeneratePDW(ServerContext* context,
                       const Empty* request,
                       PDWStream* reply) override {
        auto start = std::chrono::high_resolution_clock::now();
        
        generator_.generate(duration_, sample_rate_);
        analyzer_.analyze(generator_.getIQ(), sample_rate_);
        auto pdws = pdw_extractor_.extract(analyzer_.getFrequencies(), 
                                           analyzer_.getAmplitudes());
        
        for (const auto& p : pdws) {
            auto* pdw = reply->add_pdws();
            pdw->set_toa(p.toa);
            pdw->set_frequency(p.frequency);
            pdw->set_amplitude(p.amplitude);
            pdw->set_pulse_width(p.pulseWidth);
            pdw->set_pri(p.pri);
            pdw->set_modulation(p.modulationType);
        }
        reply->set_total_count(pdws.size());
        
        auto end = std::chrono::high_resolution_clock::now();
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
        
        return Status::OK;
    }
    
    // 订阅实时频谱流（Server Streaming）
    Status SubscribeSpectrum(ServerContext* context,
                             const SubscribeRequest* request,
                             ServerWriter<SpectrumFrame>* writer) override {
        uint32_t interval_ms = request->interval_ms();
        if (interval_ms < 100) interval_ms = 100;  // 最小100ms
        
        running_ = true;
        
        while (!context->IsCancelled() && running_) {
            SpectrumFrame frame;
            
            generator_.generate(duration_, sample_rate_);
            analyzer_.analyze(generator_.getIQ(), sample_rate_);
            
            const auto& freqs = analyzer_.getFrequencies();
            const auto& amps = analyzer_.getAmplitudes();
            
            for (double f : freqs) frame.add_frequencies(f);
            for (double a : amps) frame.add_amplitudes(a);
            frame.set_timestamp_us(
                std::chrono::duration_cast<std::chrono::microseconds>(
                    std::chrono::high_resolution_clock::now().time_since_epoch()
                ).count()
            );
            
            if (!writer->Write(frame)) {
                break;
            }
            
            std::this_thread::sleep_for(std::chrono::milliseconds(interval_ms));
        }
        
        running_ = false;
        return Status::OK;
    }
    
    // 订阅实时PDW流（Server Streaming）
    Status SubscribePDW(ServerContext* context,
                        const Empty* request,
                        ServerWriter<PDW>* writer) override {
        running_ = true;
        
        while (!context->IsCancelled() && running_) {
            generator_.generate(duration_, sample_rate_);
            analyzer_.analyze(generator_.getIQ(), sample_rate_);
            auto pdws = pdw_extractor_.extract(analyzer_.getFrequencies(),
                                               analyzer_.getAmplitudes());
            
            for (const auto& p : pdws) {
                PDW pdw;
                pdw.set_toa(p.toa);
                pdw.set_frequency(p.frequency);
                pdw.set_amplitude(p.amplitude);
                pdw.set_pulse_width(p.pulseWidth);
                pdw.set_pri(p.pri);
                pdw.set_modulation(p.modulationType);
                
                if (!writer->Write(pdw)) {
                    running_ = false;
                    return Status::OK;
                }
            }
            
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
        
        return Status::OK;
    }
    
    // 订阅实时场景状态（Server Streaming）
    Status SubscribeSceneState(ServerContext* context,
                               const Empty* request,
                               ServerWriter<SceneState>* writer) override {
        running_ = true;
        
        while (!context->IsCancelled() && running_) {
            SceneState state;
            
            for (const auto& [name, params] : emitter_db_.getEmitters()) {
                auto* emitter = state.add_emitters();
                emitter->set_name(name);
                emitter->set_freq(params.frequency);
                emitter->set_amp(linearTodB(params.amplitude));
                
                std::string mod_str = "CW";
                switch (params.modulation) {
                    case SignalParams::CW: mod_str = "CW"; break;
                    case SignalParams::PULSE: mod_str = "PULSE"; break;
                    case SignalParams::LFM: mod_str = "LFM"; break;
                    case SignalParams::BPSK: mod_str = "BPSK"; break;
                    default: mod_str = "CW"; break;
                }
                emitter->set_mod(mod_str);
                emitter->set_pri(params.pri);
                emitter->set_pw(params.pulseWidth);
            }
            
            if (jamming_.type != "" && jamming_.strength > 0) {
                auto* jam = state.add_jamming();
                jam->set_type(jamming_.type);
                jam->set_strength(jamming_.strength);
                jam->set_freq(jamming_.frequency);
                jam->set_bw(jamming_.bandwidth);
            }
            
            state.set_noise_floor(noise_floor_db_);
            
            if (!writer->Write(state)) {
                break;
            }
            
            std::this_thread::sleep_for(std::chrono::milliseconds(1000));
        }
        
        return Status::OK;
    }
    
    // 获取系统状态
    Status GetStatus(ServerContext* context,
                     const Empty* request,
                     SystemStatus* reply) override {
        reply->set_running(running_.load());
        reply->set_emitter_count(emitter_db_.size());
        reply->set_jamming_count(jamming_.type.empty() ? 0 : 1);
        reply->set_processing_time_ms(0);  // 实时计算在调用时获取
        
        auto threats = threat_assessor_.getThreatLevel(emitter_db_.getEmitters());
        reply->set_threat_level(threats.empty() ? "NONE" : threats[0].second);
        
        return Status::OK;
    }
};

void RunServer(uint16_t port) {
    std::string server_address = "0.0.0.0:" + std::to_string(port);
    SignalSimulationServiceImpl service;
    
    ServerBuilder builder;
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);
    
    std::unique_ptr<Server> server(builder.BuildAndStart());
    std::cout << "gRPC Server listening on " << server_address << std::endl;
    
    server->Wait();
}

int main(int argc, char** argv) {
    uint16_t port = 50051;
    if (argc > 1) {
        port = static_cast<uint16_t>(std::atoi(argv[1]));
    }
    
    std::cout << "=== Pragya-Pravah gRPC C++ Service ===" << std::endl;
    std::cout << "Starting server on port " << port << std::endl;
    
    RunServer(port);
    
    return 0;
}
