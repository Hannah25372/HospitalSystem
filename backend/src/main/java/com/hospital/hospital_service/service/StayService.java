package com.hospital.hospital_service.service;

import com.hospital.hospital_service.database.Hospital;
import com.hospital.hospital_service.database.Patient;
import com.hospital.hospital_service.database.Stay;
import com.hospital.hospital_service.database.enums.StayStatus;
import com.hospital.hospital_service.repository.HospitalRegistrationRepository;
import com.hospital.hospital_service.repository.HospitalRepository;
import com.hospital.hospital_service.repository.PatientRepository;
import com.hospital.hospital_service.repository.StayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StayService {

    private final StayRepository stayRepository;
    private final PatientRepository patientRepository;
    private final HospitalRepository hospitalRepository;
    private final HospitalRegistrationRepository hospitalRegistrationRepository;

    public Stay createStay(Long patientId, Long hospitalId, LocalDate startDate, LocalDate endDate) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found: " + hospitalId));
        
        LocalDate admissionDate = hospitalRegistrationRepository
            .findByHospitalIdAndPatientId(hospitalId, patientId)
            .orElseThrow(() -> new RuntimeException("Patient not registered at hospital"))
            .getAdmissionDate();

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                "End date cannot be before start date"
            );
        }

        if (startDate.isBefore(admissionDate)) {
            throw new IllegalArgumentException(
                "Start date cannot be before addmission date"
            );
        }

        Stay stay = new Stay();
        stay.setPatient(patient);
        stay.setHospital(hospital);
        stay.setStartDate(startDate);
        stay.setEndDate(endDate);
        stay.setStatus(StayStatus.LIVE);
        return stayRepository.save(stay);
    }

    public Stay cancelStay(Long stayId) {
        Stay stay = stayRepository.findById(stayId)
                .orElseThrow(() -> new RuntimeException("Stay not found: " + stayId));
        stay.setStatus(StayStatus.CANCELLED);
        return stayRepository.save(stay);
    }

    public Page<Stay> listStaysByPatient(Long patientId, Pageable pageable) {
        return stayRepository.findByPatientId(patientId, pageable);
    }

}
