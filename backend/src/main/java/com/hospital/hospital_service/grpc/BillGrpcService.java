package com.hospital.hospital_service.grpc;

import com.hospital.hospital_service.database.Bill;
import com.hospital.hospital_service.service.BillService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@GrpcService
@RequiredArgsConstructor
public class BillGrpcService extends BillServiceGrpc.BillServiceImplBase {

    private final BillService billService;

    @Override
    public void markBillPaid(MarkBillPaidRequest request, StreamObserver<BillMessage> responseObserver) {
        try {
            Bill bill = billService.markBillPaid(request.getId());
            responseObserver.onNext(toProto(bill));
            responseObserver.onCompleted();
        } catch (RuntimeException e) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getBill(GetBillRequest request, StreamObserver<BillMessage> responseObserver) {
        try {
            Bill bill = billService.getBill(request.getId());
            responseObserver.onNext(toProto(bill));
            responseObserver.onCompleted();
        } catch (RuntimeException e) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listBillsByPatient(ListBillsByPatientRequest request, StreamObserver<ListBillsResponse> responseObserver) {
        try {
            PageRequest pageable = PageRequest.of(request.getPage().getPage(), request.getPage().getSize());
            Page<Bill> page = billService.listBillsByPatient(request.getPatientId(), pageable);

            ListBillsResponse response = ListBillsResponse.newBuilder()
                    .addAllBills(page.getContent().stream().map(this::toProto).toList())
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

    private BillMessage toProto(Bill bill) {
        return BillMessage.newBuilder()
                .setId(bill.getId())
                .setPatientId(bill.getPatient().getId())
                .setHospitalId(bill.getHospital().getId())
                .setTotalAmount(bill.getTotalAmount())
                .setStatus(toProtoStatus(bill.getStatus()))
                .setCreatedAt(bill.getCreatedAt().toString())
                .setUpdatedAt(bill.getUpdatedAt().toString())
                .build();
    }

    private static BillStatus toProtoStatus(com.hospital.hospital_service.database.enums.BillStatus status) {
        return switch (status) {
            case OUTSTANDING -> BillStatus.BILL_STATUS_OUTSTANDING;
            case PAID -> BillStatus.BILL_STATUS_PAID;
        };
    }
}
