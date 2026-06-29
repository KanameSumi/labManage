'use client'

import axios from "../../plugins/axios";
import {
    Box,
    Button,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
} from "@mui/material";

import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";

type EquipmentData = {
    id: number;
    name: string;
    category: number;
    is_borrowed: boolean;
    updated_at: string;
    borrower: number | null;
    borrower_name: string | null;
};

type MemberData = {
    id: number;
    name: string;
    student_id: string;
};

export default function Page() {
    const [data, setData] = useState<EquipmentData[]>([]);
    const [members, setMembers] = useState<MemberData[]>([]);
    const [open, setOpen] = useState(false);
    const [borrowOpen, setBorrowOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [targetEquipment, setTargetEquipment] = useState<EquipmentData | null>(null);
    const [selectedBorrower, setSelectedBorrower] = useState<MemberData | null>(null);
    const [borrowError, setBorrowError] = useState<string>("");
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState(1);
    const [deleteOpen, setDeleteOpen] = useState(false);

    useEffect(() => {
        axios
            .get("/api/equipment/manage/")
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => {
                console.error(err);
            });

        axios
            .get("/api/member/all/")
            .then((res) => {
                setMembers(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    const categoryMap: Record<number, string> = {
        1: "鍵",
        2: "機材",
        3: "書籍",
    };

    const categoryLabel = (category: number) => categoryMap[category] ?? "不明";

    const groupedEquipments = data.reduce(
        (groups, equipment) => {
            if (!groups[equipment.category]) {
                groups[equipment.category] = [];
            }
            groups[equipment.category].push(equipment);
            return groups;
        },
        {} as Record<number, EquipmentData[]>
    );

    Object.values(groupedEquipments).forEach((equipments) => {
        equipments.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    });

    const getBorrowerStudentId = (equipment: EquipmentData) => {
        if (!equipment.borrower) return null;
        const borrower = members.find((member) => member.id === equipment.borrower);
        return borrower?.student_id ?? null;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    const handleShowNewRow = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleCreate = async () => {
        try {
            const res = await axios.post("/api/equipment/manage/", {
                name: newName,
                category: newCategory,
            });
            setData((prev) => [...prev, res.data]);
            setOpen(false);
            setNewName("");
            setNewCategory(1);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBorrowClick = (equipment: EquipmentData) => {
        setTargetEquipment(equipment);
        setBorrowError("");
        if (equipment.is_borrowed) {
            setReturnOpen(true);
        } else {
            // 初期選択をクリアまたは既存の借り手を設定
            const init = equipment.borrower ? members.find((m) => m.id === equipment.borrower) ?? null : null;
            setSelectedBorrower(init);
            setBorrowOpen(true);
        }
    };

    const handleBorrow = async () => {
        if (!targetEquipment) return;
        if (!selectedBorrower) {
            setBorrowError("借り手を選択してください。");
            return;
        }

        try {
            const res = await axios.patch(`/api/equipment/borrow/${targetEquipment.id}/`, {
                is_borrowed: true,
                borrower: selectedBorrower.id,
            });
            setData((prev) => prev.map((item) => (item.id === targetEquipment.id ? res.data : item)));
            setBorrowOpen(false);
            setTargetEquipment(null);
            setSelectedBorrower(null);
        } catch (err: any) {
            console.error(err);
            setBorrowError(err?.response?.data?.detail || "貸出処理に失敗しました。");
        }
    };

    const handleReturn = async () => {
        if (!targetEquipment) return;
        try {
            const res = await axios.patch(`/api/equipment/borrow/${targetEquipment.id}/`, {
                is_borrowed: false,
                borrower: null,
            });
            setData((prev) => prev.map((item) => (item.id === targetEquipment.id ? res.data : item)));
            setReturnOpen(false);
            setTargetEquipment(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteClick = (equipment: EquipmentData) => {
        setTargetEquipment(equipment);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!targetEquipment) return;

        try {
            await axios.delete(`/api/equipment/manage/${targetEquipment.id}/`);

            setData((prev) =>
                prev.filter((item) => item.id !== targetEquipment.id)
            );
            setDeleteOpen(false);
            setTargetEquipment(null);
        } catch (err: any) {
            alert(err.response?.data?.detail ?? "削除に失敗しました");
        }
    };

    return (
        <>
            <Typography variant="h5" sx={{ mb: 2 }}>
                備品一覧
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleShowNewRow} sx={{ mb: 2 }}>
                備品を追加する
            </Button>

            {Object.entries(groupedEquipments).map(([category, equipments]) => (
                <Box key={category} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        {categoryLabel(Number(category))}
                    </Typography>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ minWidth: 150 }}>備品名</TableCell>
                                    <TableCell sx={{ minWidth: 150 }}>貸出状況</TableCell>
                                    <TableCell sx={{ minWidth: 120 }}>借り手</TableCell>
                                    <TableCell sx={{ minWidth: 150 }}>最終更新</TableCell>
                                    <TableCell sx={{ minWidth: 50 }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {equipments.map((equipment) => (
                                    <TableRow key={equipment.id}>
                                        <TableCell>{equipment.name}</TableCell>
                                        <TableCell>
                                            <Button
                                                sx={{ minWidth: 90 }}
                                                variant="contained"
                                                color={equipment.is_borrowed ? "warning" : "inherit"}
                                                onClick={() => handleBorrowClick(equipment)}
                                            >
                                                {equipment.is_borrowed ? "貸出中" : "貸出可能"}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            {equipment.is_borrowed ? getBorrowerStudentId(equipment) || "-" : "ー"}
                                        </TableCell>
                                        <TableCell>{formatDate(equipment.updated_at)}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleDeleteClick(equipment)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ))}

            <Dialog open={borrowOpen} onClose={() => setBorrowOpen(false)}>
                <DialogTitle>備品を貸し出す</DialogTitle>
                        <DialogContent sx={{ minWidth: 320, display: "grid", gap: 2, pt: 2 }}>
                            <Typography>対象: {targetEquipment?.name}</Typography>
                            <Autocomplete
                                options={members}
                                getOptionLabel={(option) => `${option.student_id} ${option.name}`}
                                value={selectedBorrower}
                                onChange={(_, newValue) => setSelectedBorrower(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="借り手（学籍番号で検索）" variant="outlined" />
                                )}
                                fullWidth
                            />
                            {borrowError && <Alert severity="error">{borrowError}</Alert>}
                        </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBorrowOpen(false)}>キャンセル</Button>
                    <Button variant="contained" onClick={handleBorrow}>貸し出す</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={returnOpen} onClose={() => setReturnOpen(false)}>
                <DialogTitle>備品を返却する</DialogTitle>
                <DialogContent sx={{ minWidth: 320 }}>
                    <Typography>{targetEquipment?.name} を返却しますか？</Typography>
                    <Typography sx={{ mt: 1 }}>借り手: {targetEquipment?.borrower_name || "-"}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReturnOpen(false)}>キャンセル</Button>
                    <Button variant="contained" color="success" onClick={handleReturn}>返却する</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>備品追加</DialogTitle>
                <DialogContent sx={{ minWidth: 300 }}>
                    <Select fullWidth value={newCategory} onChange={(e) => setNewCategory(Number(e.target.value))}>
                        <MenuItem value={1}>鍵</MenuItem>
                        <MenuItem value={2}>機材</MenuItem>
                        <MenuItem value={3}>書籍</MenuItem>
                    </Select>
                    <Box sx={{ height: 12 }} />
                    <TextField label="備品名" fullWidth value={newName} onChange={(e) => setNewName(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>キャンセル</Button>
                    <Button onClick={handleCreate}>登録</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>「{targetEquipment?.name}」を削除しますか？</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>キャンセル</Button>
                    <IconButton color="error" onClick={handleDelete}><DeleteIcon /></IconButton>
                </DialogActions>
            </Dialog>
        </>
    );
}
