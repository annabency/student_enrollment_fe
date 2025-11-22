import React, { useState, useEffect } from "react";
import {
    Table,
    Button,
    Space,
    Input,
    Card,
    message,
    Popconfirm,
    Tag,
    Typography,
    Row,
    Col,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { studentService } from "../services/studentService";
import StudentForm from "../components/StudentForm";

const { Title } = Typography;
const { Search } = Input;

const StudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [searchText, setSearchText] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    
    const fetchStudents = async (page = 1, limit = 10, search = "") => {
        setLoading(true);
        try {
            const response = await studentService.getAllStudents({
                page,
                limit,
                search,
            });

            setStudents(response.data);
            setPagination({
                current: response.pagination.currentPage,
                pageSize: limit,
                total: response.pagination.totalStudents,
            });
        } catch (error) {
            message.error("Failed to fetch students");
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

 
    useEffect(() => {
        fetchStudents();
    }, []);

   
    const handleTableChange = (paginationConfig) => {
        fetchStudents(
            paginationConfig.current,
            paginationConfig.pageSize,
            searchText
        );
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchText(value);
        fetchStudents(1, pagination.pageSize, value);
    };

    // Handle create/edit student
    const handleSubmit = async (values) => {
        setFormLoading(true);
        try {
            if (selectedStudent) {
                // Update existing student
                await studentService.updateStudent(selectedStudent.student_id, values);
                message.success("Student updated successfully");
            } else {
                // Create new student
                await studentService.createStudent(values);
                message.success("Student created successfully");
            }

            setModalVisible(false);
            setSelectedStudent(null);
            fetchStudents(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Operation failed";
            message.error(errorMessage);
            console.error("Error submitting student:", error);
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete student
    const handleDelete = async (studentId) => {
        try {
            await studentService.deleteStudent(studentId);
            message.success("Student deleted successfully");
            fetchStudents(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            const errorMessage =
                error.response?.data?.error || "Failed to delete student";
            message.error(errorMessage);
            console.error("Error deleting student:", error);
        }
    };

    // Handle edit button click
    const handleEdit = (student) => {
        setSelectedStudent(student);
        setModalVisible(true);
    };

    // Handle add new student
    const handleAddNew = () => {
        setSelectedStudent(null);
        setModalVisible(true);
    };

    // Table columns configuration
    const columns = [
        {
            title: "ID",
            dataIndex: "student_id",
            key: "student_id",
            width: 80,
        },
        {
            title: "Name",
            key: "name",
            render: (_, record) => (
                <span>
                    <UserOutlined style={{ marginRight: 8 }} />
                    {`${record.first_name} ${record.last_name}`}
                </span>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Date of Birth",
            dataIndex: "date_of_birth",
            key: "date_of_birth",
            render: (date) => (date ? dayjs(date).format("MMM DD, YYYY") : "-"),
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
            render: (phone) => phone || "-",
        },
        {
            title: "Created",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => (
                <Tag color="blue">{dayjs(date).format("MMM DD, YYYY")}</Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete Student"
                        description="Are you sure you want to delete this student?"
                        onConfirm={() => handleDelete(record.student_id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <Card>
                <Row
                    justify="space-between"
                    align="middle"
                    style={{ marginBottom: 16 }}
                >
                    <Col>
                        <Title level={2} style={{ margin: 0 }}>
                            <UserOutlined style={{ marginRight: 8 }} />
                            Students Management
                        </Title>
                    </Col>
                </Row>

                <Row
                    justify="space-between"
                    align="middle"
                    style={{ marginBottom: 16 }}
                >
                    <Col span={12}>
                        <Search
                            placeholder="Search students by name or email..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={handleSearch}
                            style={{ maxWidth: 400 }}
                        />
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={handleAddNew}
                        >
                            Add New Student
                        </Button>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={students}
                    rowKey="student_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} students`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                />

                <StudentForm
                    visible={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setSelectedStudent(null);
                    }}
                    onSubmit={handleSubmit}
                    student={selectedStudent}
                    loading={formLoading}
                />
            </Card>
        </div>
    );
};

export default StudentsPage;
