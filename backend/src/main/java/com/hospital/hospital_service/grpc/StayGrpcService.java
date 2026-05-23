package com.hospital.hospital_service.grpc;

import com.hospital.hospital_service.database.Stay;
import com.hospital.hospital_service.service.StayService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;

@GrpcService
@RequiredArgsConstructor
public class StayGrpcService extends StayServiceGrpc.StayServiceImplBase {

    private final StayService stayService;

    @Override
    public void createStay(CreateStayRequest request, StreamObserver<StayMessage> responseObserver) {
        try {
            Stay stay = stayService.createStay(
                    request.getPatientId(),
                    request.getHospitalId(),
                    LocalDate.parse(request.getStartDate()),
                    LocalDate.parse(request.getEndDate()));
            responseObserver.onNext(toProto(stay));
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void cancelStay(CancelStayRequest request, StreamObserver<StayMessage> responseObserver) {
        try {
            Stay stay = stayService.cancelStay(request.getId());
            responseObserver.onNext(toProto(stay));
            responseObserver.onCompleted();
        } catch (RuntimeException e) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listStaysByPatient(ListStaysByPatientRequest request, StreamObserver<ListStaysResponse> responseObserver) {
        try {
            PageRequest pageable = PageRequest.of(request.getPage().getPage(), request.getPage().getSize());
            Page<Stay> page = stayService.listStaysByPatient(request.getPatientId(), pageable);

            ListStaysResponse response = ListStaysResponse.newBuilder()
                    .addAllStays(page.getContent().stream().map(this::toProto).toList())
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

    private StayMessage toProto(Stay stay) {
        StayMessage.Builder builder = StayMessage.newBuilder()
                .setId(stay.getId())
                .setPatientId(stay.getPatient().getId())
                .setHospitalId(stay.getHospital().getId())
                .setStartDate(stay.getStartDate().toString())
                .setEndDate(stay.getEndDate().toString())
                .setStatus(toProtoStatus(stay.getStatus()))
                .setCreatedAt(stay.getCreatedAt().toString());
        if (stay.getBill() != null) {
            builder.setBillId(stay.getBill().getId());
        }
        return builder.build();
    }

    private static StayStatus toProtoStatus(com.hospital.hospital_service.database.enums.StayStatus status) {
        return switch (status) {
            case LIVE -> StayStatus.STAY_STATUS_LIVE;
            case CANCELLED -> StayStatus.STAY_STATUS_CANCELLED;
        };
    }
}
