import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { Button, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  GetHospitalsDocument,
  GetPatientsDocument,
} from '../graphql/__generated__/graphql';
import type { GetPatientsQuery, Sex } from '../graphql/__generated__/graphql';

type Patient = GetPatientsQuery['patients']['patients'][number];

const PAGE_SIZE = 10;

const SEX_TAG: Record<Sex, { color: string; label: string }> = {
  SEX_MALE: { color: 'blue', label: 'Male' },
  SEX_FEMALE: { color: 'pink', label: 'Female' },
  SEX_UNSPECIFIED: { color: 'default', label: '—' },
};

export default function PatientListView() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState('');

  const { data, loading } = useQuery(GetPatientsDocument, {
    variables: { page: page - 1, size: PAGE_SIZE },
  });

  const { data: hospitalsData } = useQuery(GetHospitalsDocument, {
    variables: { size: 100 },
  });

  const patients = data?.patients.patients ?? [];
  const displayed = nameFilter
    ? patients.filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(nameFilter.toLowerCase()) ||
          p.email.toLowerCase().includes(nameFilter.toLowerCase()),
      )
    : patients;

  const columns: TableColumnsType<Patient> = [
    {
      title: 'Name',
      render: (_, r) => `${r.firstName} ${r.lastName}`,
    },
    { title: 'Date of Birth', dataIndex: 'dateOfBirth' },
    {
      title: 'Sex',
      dataIndex: 'sex',
      render: (sex: Sex) => {
        const { color, label } = SEX_TAG[sex];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    { title: 'Email', dataIndex: 'email' },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, r) => (
        <Button
          type="link"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/patients/${r.id}`);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const total = data?.patients.pageInfo.totalElements ?? 0;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          Patients
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/patients/new')}
        >
          Register
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by name or email"
          allowClear
          style={{ width: 260 }}
          onSearch={setNameFilter}
          onChange={(e) => {
            if (!e.target.value) setNameFilter('');
          }}
        />
        <span>
            <Select
              placeholder="Filter by hospital"
              style={{ width: 220 }}
              options={hospitalsData?.hospitals.hospitals.map((h) => ({
                value: h.id,
                label: h.name,
              }))}
              suffixIcon={<InfoCircleOutlined />}
            />
          </span>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={displayed}
        columns={columns}
        onRow={(r) => ({
          onClick: () => navigate(`/patients/${r.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={
          nameFilter
            ? false
            : {
                current: page,
                pageSize: PAGE_SIZE,
                total,
                onChange: (p) => setPage(p),
                showTotal: (t) => `${t} patients`,
              }
        }
      />
    </div>
  );
}
