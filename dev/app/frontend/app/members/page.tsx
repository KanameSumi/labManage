'use client'

import axios from "axios";
import {
    Box,
    Button,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    MenuItem,
    FormControlLabel,
    Checkbox,
} from "@mui/material";

import { useState, useEffect } from "react";

type MemberData = {
    id: number;
    name: string;
    student_id: string;
    is_present: boolean;
    status: number;
    updated_at: string;
};

export default function Page() {
    const [data, setData] = useState<Array<MemberData>>([]);
    
    const [showStudentId, setShowStudentId] = useState<boolean>(false);
    const [showOther, setShowOther] = useState<boolean>(false);

    useEffect(() => {
        axios
            .get("/api/member/all/")
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    // 在室状況
    const handleAttendanceToggle = (memberId: number) => {
        const target = data.find(m => m.id === memberId);
        if (!target) return;

        const newValue = !target.is_present;

        setData((prev) =>
            prev.map((member) =>
                member.id === memberId
                    ? {
                        ...member,
                        is_present: newValue,
                        status: newValue ? 0 : member.status,
                        updated_at: new Date().toISOString(),
                    }
                    : member
            )
        );

        axios.patch(`/api/member/present/${memberId}/`, {
            is_present: newValue
        }).catch((err) => {
            console.error(err);
            setData((prev) =>
                prev.map((member) =>
                    member.id === memberId
                        ? { ...member, is_present: !newValue }
                        : member
                )
            );
        });
    };

    // 来室予定
    const statusOptions = [
        { value: 0, label: "未登録" },
        { value: 1, label: "来室予定あり" },
        { value: 2, label: "来室予定なし" },
    ];

    function StatusSelect({ member, setMembers }: { member: MemberData, setMembers: React.Dispatch<React.SetStateAction<MemberData[]>> }) {
        const handleChange = async (e: any) => {
            const newStatus = Number(e.target.value);

            await axios.patch(`/api/member/schedule/${member.id}/`, {
                status: newStatus,
            });

            setMembers((prev) =>
                prev.map((m) =>
                    m.id === member.id
                        ? {
                            ...m,
                            status: newStatus,
                            updated_at: new Date().toISOString(),
                        }
                        : m
                )
            );
        };

        return (
            <Select value={member.status} onChange={handleChange} size="small" sx={{ width: 150, "& .MuiSelect-select": { textAlign: "center" } }}>
                {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>
        );
    }

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

    const now = new Date();
    const year = now.getFullYear() % 100;
    const month = now.getMonth() + 1;

    const Master = 0; 
    const B3_GRADE = month <= 3 ? year - 3 : year - 2;
    const B4_GRADE = month <= 3 ? year - 4 : year - 3;

    const gradeMap: Record<number, string> = {
        [Master]: "Master",
        [B4_GRADE]: "B4",
        [B3_GRADE]: "B3",
    };
    
// 1. ラベル表示用の関数を変更
    const gradeLabel = (groupKey: string) => {
        // キーからプレフィックス（"grade_" や "other_"）を取り除いて判定
        if (groupKey.startsWith("grade_")) {
            const num = Number(groupKey.replace("grade_", ""));
            return gradeMap[num] ?? `Other_${num}`;
        }
        if (groupKey.startsWith("other_")) {
            const num = groupKey.replace("other_", "");
            return `Other_${num}`;
        }
        return groupKey;
    };

    const groupedMembers = data.reduce(
        (groups, member) => {
            const grade = Number(member.student_id.slice(1, 3));
            const isKnownGrade = gradeMap[grade] !== undefined;

            if (!showOther && !isKnownGrade) return groups;

            // 2. キーの頭に完全に文字（アルファベット）をくっつける
            // アルファベット順で g(grade) は o(other) より先になるため、現役生が必ず上になります
            const groupKey = isKnownGrade ? `grade_${grade}` : `other_${grade}`;

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }

            groups[groupKey].push(member);
            return groups;
        },
        {} as Record<string, MemberData[]> // 3. ここを string に変更
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                メンバー一覧
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControlLabel
                    control={
                        <Checkbox 
                            checked={showStudentId} 
                            onChange={(e) => setShowStudentId(e.target.checked)} 
                        />
                    }
                    label="学籍番号を表示する"
                />
                <FormControlLabel
                    control={
                        <Checkbox 
                            checked={showOther} 
                            onChange={(e) => setShowOther(e.target.checked)} 
                        />
                    }
                    label="Other（その他学年）を表示する"
                />
            </Box>

　{Object.entries(groupedMembers).map(([grade, members]) => (
    <Box key={grade} sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
            {/* Number() を外して文字列のまま渡す */}
            {gradeLabel(grade)}
        </Typography>
        {/* 以下テーブル部分はそのまま */}

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {showStudentId && <TableCell sx={{ minWidth: 30 }}>学籍番号</TableCell>}
                                    <TableCell sx={{ minWidth: 80 }}>氏名</TableCell>
                                    <TableCell sx={{ minWidth: 100 }}>在室状況</TableCell>
                                    <TableCell sx={{ minWidth: 150 }}>本日予定</TableCell>
                                    <TableCell sx={{ minWidth: 120 }}>最終更新</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id}>
                                        {showStudentId && <TableCell>{member.student_id}</TableCell>}
                                        <TableCell>{member.name}</TableCell>

                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color={member.is_present ? "warning" : "inherit"}
                                                onClick={() => handleAttendanceToggle(member.id)}
                                            >
                                                {member.is_present ? "在室" : "不在"}
                                            </Button>
                                        </TableCell>

                                        <TableCell>
                                            <StatusSelect member={member} setMembers={setData} />
                                        </TableCell>

                                        <TableCell>
                                            {formatDate(member.updated_at)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ))}
        </Box>
    );
}