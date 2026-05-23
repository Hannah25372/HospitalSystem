package com.hospital.hospital_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.hospital.hospital_service.database.Bill;

public interface BillRepository extends JpaRepository<Bill, Long>{
    
}
