package com.hospital.hospital_service.grpc;

import com.hospital.hospital_service.database.HospitalRegistration;
import com.hospital.hospital_service.database.Patient;
import com.hospital.hospital_service.service.PatientService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;

@GrpcService
@RequiredArgsConstructor
public class PatientGrpcService extends PatientServiceGrpc.PatientServiceImplBase {

    private final PatientService patientService;

    @Override
    public void createPatient(CreatePatientRequest request, StreamObserver<PatientMessage> responseObserver) {
        try {
            Patient patient = patientService.createPatient(
                    request.getFirstName(),
                    request.getLastName(),
                    LocalDate.parse(request.getDateOfBirth()),
                    toEntitySex(request.getSex()),
                    request.getEmail());
            responseObserver.onNext(toProto(patient));
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void getPatient(GetPatientRequest request, StreamObserver<PatientMessage> responseObserver) {
        try {
            Patient patient = patientService.getPatient(request.getId());
            responseObserver.onNext(toProto(patient));
            responseObserver.onCompleted();
        } catch (RuntimeException e) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void listPatients(ListPatientsRequest request, StreamObserver<ListPatientsResponse> responseObserver) {
        try {
            PageRequest pageable = PageRequest.of(request.getPage().getPage(), request.getPage().getSize());
            Page<Patient> page = patientService.listPatients(pageable);

            ListPatientsResponse response = ListPatientsResponse.newBuilder()
                    .addAllPatients(page.getContent().stream().map(this::toProto).toList())
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

    @Override
    public void listPatientsByHospital(ListPatientsByHospitalRequest request, StreamObserver<ListPatientsResponse> responseObserver) {
        try {
            PageRequest pageable = PageRequest.of(request.getPage().getPage(), request.getPage().getSize());
            Page<Patient> page = patientService.listPatientsByHospital(request.getHospitalId(), pageable);

            ListPatientsResponse response = ListPatientsResponse.newBuilder()
                    .addAllPatients(page.getContent().stream().map(this::toProto).toList())
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

    @Override
    public void registerAtHospital(RegisterAtHospitalRequest request, StreamObserver<HospitalRegistrationMessage> responseObserver) {
        try {
            HospitalRegistration registration = patientService.registerAtHospital(
                    request.getPatientId(),
                    request.getHospitalId(),
                    LocalDate.parse(request.getAdmissionDate()));
            responseObserver.onNext(toProto(registration));
            responseObserver.onCompleted();
        } catch (RuntimeException e) {
            responseObserver.onError(Status.NOT_FOUND.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    private PatientMessage toProto(Patient patient) {
        return PatientMessage.newBuilder()
                .setId(patient.getId())
                .setFirstName(patient.getFirstName())
                .setLastName(patient.getLastName())
                .setDateOfBirth(patient.getDateOfBirth().toString())
                .setSex(toProtoSex(patient.getSex()))
                .setEmail(patient.getEmail())
                .setCreatedAt(patient.getCreatedAt().toString())
                .setUpdatedAt(patient.getUpdatedAt().toString())
                .build();
    }

    private HospitalRegistrationMessage toProto(HospitalRegistration registration) {
        return HospitalRegistrationMessage.newBuilder()
                .setId(registration.getId())
                .setPatientId(registration.getPatient().getId())
                .setHospitalId(registration.getHospital().getId())
                .setAdmissionDate(registration.getAdmissionDate().toString())
                .build();
    }

    private static Sex toProtoSex(com.hospital.hospital_service.database.enums.Sex sex) {
        return switch (sex) {
            case MALE -> Sex.SEX_MALE;
            case FEMALE -> Sex.SEX_FEMALE;
        };
    }

    private static com.hospital.hospital_service.database.enums.Sex toEntitySex(Sex sex) {
        return switch (sex) {
            case SEX_MALE -> com.hospital.hospital_service.database.enums.Sex.MALE;
            case SEX_FEMALE -> com.hospital.hospital_service.database.enums.Sex.FEMALE;
            default -> throw new IllegalArgumentException("Unexpected sex value: " + sex);
        };
    }
}
