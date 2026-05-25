import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Select,
  Space,
  Typography,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import {
  CreatePatientDocument,
  GetHospitalsDocument,
  GetPatientsDocument,
  RegisterAtHospitalDocument,
  CreateHospitalDocument
} from '../graphql/__generated__/graphql';
import type { Sex } from '../graphql/__generated__/graphql';

type PatientMode = 'new' | 'existing' | 'hospital';

interface FormValues {
  patientMode: PatientMode;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Dayjs;
  sex?: Sex;
  email?: string;
  existingPatientId?: string;
  hospitalId: string;
  admissionDate: Dayjs;
  name?: string
  address?: string
  dailyRate?: number
}

const SEX_OPTIONS = [
  { value: 'SEX_MALE' as const, label: 'Male' },
  { value: 'SEX_FEMALE' as const, label: 'Female' },
];

export default function PatientRegistrationView() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [patientMode, setPatientMode] = useState<PatientMode>('new');
  const [submitting, setSubmitting] = useState(false);

  const { data: hospitalsData } = useQuery(GetHospitalsDocument, {
    variables: { size: 100 },
  });

  const { data: patientsData } = useQuery(GetPatientsDocument, {
    variables: { size: 100 },
    skip: patientMode !== 'existing',
  });

  const [createPatient] = useMutation(CreatePatientDocument, {
    refetchQueries: ['GetPatients'],
  });
  const [registerAtHospital] = useMutation(RegisterAtHospitalDocument);
  const [createHospital] = useMutation(CreateHospitalDocument, {
    refetchQueries: ['GetHospitals'],
  });

  async function handleNewPatient() {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    setSubmitting(true);
    try {
      const { data } = await createPatient({
        variables: {
          firstName: values.firstName!,
          lastName: values.lastName!,
          dateOfBirth: values.dateOfBirth!.format('YYYY-MM-DD'),
          sex: values.sex!,
          email: values.email!,
        },
      });
      const patientId = data!.createPatient.id;

      void message.success('Patient created successfully');
      navigate(`/patients/${patientId}`);
    } catch (err: unknown) {
      void message.error(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterPatient() {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    setSubmitting(true);
    try {
      const patientId = values.existingPatientId!;
      
      await registerAtHospital({
        variables: {
          patientId,
          hospitalId: values.hospitalId,
          admissionDate: values.admissionDate.format('YYYY-MM-DD'),
        },
      });
      void message.success('Patient registered successfully');
      navigate(`/patients/${patientId}`);
    } catch (err: unknown) {
      void message.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

    async function handleNewHospital() {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    setSubmitting(true);
    try {
      await createHospital({
        variables: {
          name: values.name!,
          address: values.address!,
          dailyRate: values.dailyRate!,
        },
      });

      void message.success('Hospital created successfully');
      form.resetFields([
                  'name',
                  'address',
                  'dailyRate'
                ]);
    } catch (err: unknown) {
      void message.error(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  }

  const patientOptions = patientsData?.patients.patients.map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName} — ${p.email}`,
  }));

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Space align="center" style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')}>
          Back
        </Button>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Register
        </Typography.Title>
      </Space>

      <Card>
        <Form form={form} layout="vertical" initialValues={{ patientMode: 'new' }}>
          <Form.Item name="patientMode" label="Patient type">
            <Radio.Group
              onChange={(e) => {
                const mode = e.target.value as PatientMode;
                setPatientMode(mode);
                form.resetFields([
                  'firstName',
                  'lastName',
                  'dateOfBirth',
                  'sex',
                  'email',
                  'existingPatientId',
                  'hospitalId',
                  'admissionDate',
                  'name',
                  'address',
                  'dailyRate'
                ]);
              }}
            >
              <Radio value="new">New patient</Radio>
              <Radio value="existing">Register patient</Radio>
              <Radio value="hospital">New Hospital</Radio>
            </Radio.Group>
          </Form.Item>

          {patientMode === 'new' && (
            <>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={(d) => d.isAfter(new Date())}
                />
              </Form.Item>
              <Form.Item
                name="sex"
                label="Sex"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select options={SEX_OPTIONS} />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input type="email" />
              </Form.Item>

              <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" loading={submitting} block onClick={handleNewPatient}>
              Create
            </Button>
          </Form.Item>
            </>
          )}

          {patientMode === 'existing' && (
            <>
            <Form.Item
              name="existingPatientId"
              label="Select Patient"
              rules={[{ required: true, message: 'Please select a patient' }]}
            >
              <Select
                showSearch
                placeholder="Search by name or email"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={patientOptions}
              />
            </Form.Item>

            <Form.Item
            name="hospitalId"
            label="Hospital"
            rules={[{ required: true, message: 'Please select a hospital' }]}
          >
            <Select
              placeholder="Select hospital"
              options={hospitalsData?.hospitals.hospitals.map((h) => ({
                value: h.id,
                label: `${h.name} — ${h.address}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="admissionDate"
            label="Admission Date"
            rules={[{ required: true, message: 'Please select admission date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

            <Divider />
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" loading={submitting} block onClick={handleRegisterPatient}>
              Register
            </Button>
          </Form.Item> 
            </>

          )}

          {patientMode === 'hospital' && (
            <>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="dailyRate"
                label="Daily Rate"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              

              <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" loading={submitting} block onClick={handleNewHospital}>
              Create
            </Button>
          </Form.Item>
            </>
          )}

        </Form>
      </Card>
    </div>
  );
}
