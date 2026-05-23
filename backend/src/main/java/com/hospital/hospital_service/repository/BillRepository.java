package com.hospital.hospital_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.hospital.hospital_service.database.Bill;

public interface BillRepository extends JpaRepository<Bill, Long> {

    Page<Bill> findByPatientId(Long patientId, Pageable pageable);

}
