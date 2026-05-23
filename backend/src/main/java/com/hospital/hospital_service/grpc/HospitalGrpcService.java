package com.hospital.hospital_service.grpc;

import com.hospital.hospital_service.database.Hospital;
import com.hospital.hospital_service.service.HospitalService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@GrpcService
@RequiredArgsConstructor
public class HospitalGrpcService extends HospitalServiceGrpc.HospitalServiceImplBase {

    private final HospitalService hospitalService;

    @Override
    public void createHospital(CreateHospitalRequest request, StreamObserver<HospitalMessage> responseObserver) {
        try {
            Hospital hospital = hospitalService.createHospital(
                    request.getName(), request.getAddress(), request.getDailyRate());
            responseObserver.onNext(toProto(hospital));
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getHospital(GetHospitalRequest request, StreamObserver<HospitalMessage> responseObserver) {
        try {
            Hospital hospital = hospitalService.getHospital(request.getId());
            responseObserver.onNext(toProto(hospital));
            responseObserver.onCompleted();
        } catch (RuntimeException e) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listHospitals(ListHospitalsRequest request, StreamObserver<ListHospitalsResponse> responseObserver) {
        try {
            PageRequest pageable = PageRequest.of(request.getPage().getPage(), request.getPage().getSize());
            Page<Hospital> page = hospitalService.listHospitals(pageable);

            ListHospitalsResponse response = ListHospitalsResponse.newBuilder()
                    .addAllHospitals(page.getContent().stream().map(this::toProto).toList())
                    .setPageInfo(PageInfo.newBuilder()
                            .setTotalElements((int) page.getTotalElements())
                            .setTotalPages(page.getTotalPages())
                            .setCurrentPage(page.getNumber())
                            .build())
                    .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    private HospitalMessage toProto(Hospital hospital) {
        return HospitalMessage.newBuilder()
                .setId(hospital.getId())
                .setName(hospital.getName())
                .setAddress(hospital.getAddress())
                .setDailyRate(hospital.getDailyRate())
                .setCreatedAt(hospital.getCreatedAt().toString())
                .setUpdatedAt(hospital.getUpdatedAt().toString())
                .build();
    }
}
