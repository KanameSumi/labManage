'use client'

import axios from "../../plugins/axios";
import { useEffect, useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    Container,
    CssBaseline,
    TextField,
    Typography,
    Alert,
    Card,
    CardContent,
    Divider,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type FormData = {
    name: string;
    student_id: string;
    email: string;
};

type MemberData = {
    id: number;
    name: string;
    student_id: string;
    is_present: boolean;
    status: number;
    updated_at: string;
};

export default function Page() {
    const router = useRouter();
    
    // 🔑 認証状態（画面を閉じたら消える sessionStorage を使用）
    const [isLoggedIn, setIsLoggedIn] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>();
    const [apiError, setApiError] = useState("");
    const [apiSuccess, setApiSuccess] = useState("");
    const [members, setMembers] = useState<MemberData[]>([]);
    const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
    const [memberLoading, setMemberLoading] = useState(false);
    const [loanLogs, setLoanLogs] = useState<Array<any>>([]);
    const [logsError, setLogsError] = useState("");
    const [csvFileName, setCsvFileName] = useState<string>("");
    const [csvLoading, setCsvLoading] = useState(false);
    const [csvResult, setCsvResult] = useState<{ success: number; failed: number; errors: Array<string> } | null>(null);

    // 🔑 ログイン状態の確認ロジック
    useEffect(() => {
        // タブを閉じたら自動消滅する sessionStorage をチェック
        const loginStatus = sessionStorage.getItem("isLoggedIn");
        setIsLoggedIn(loginStatus);
        setLoading(false);

        if (!loginStatus) {
            router.replace("/login");
        }
    }, [router]);

    // 👋 手動ログアウトの処理
    const handleLogout = () => {
        sessionStorage.removeItem("isLoggedIn"); // セッションクリア
        router.replace("/login"); // ログイン画面へ
    };

    const fetchMembers = async () => {
        setMemberLoading(true);
        try {
            const res = await axios.get("/api/member/all/");
            setMembers(res.data || []);
        } catch (err: any) {
            console.error(err);
            setApiError(err?.response?.data?.detail || "メンバー一覧の取得に失敗しました。");
        } finally {
            setMemberLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            void fetchMembers();
        }
    }, [isLoggedIn]);

    // 🔒 すべてのHooks宣言が終わった後に Early Return
    if (loading || !isLoggedIn) {
        return null; 
    }

    const parseCSVLine = (line: string) => {
        const fields: string[] = [];
        let i = 0;
        while (i < line.length) {
            if (line[i] === '"') {
                let j = i + 1;
                let value = '';
                while (j < line.length) {
                    if (line[j] === '"' && line[j + 1] === '"') { value += '"'; j += 2; }
                    else if (line[j] === '"') { j += 1; break; }
                    else { value += line[j]; j += 1; }
                }
                fields.push(value);
                while (j < line.length && line[j] !== ',') j++;
                i = j + 1;
            } else {
                let j = i;
                while (j < line.length && line[j] !== ',') j++;
                fields.push(line.slice(i, j).trim());
                i = j + 1;
            }
        }
        return fields;
    };

    const handleCsvFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (!file) { setCsvFileName(""); return; }
        setCsvFileName(file.name);
        setCsvResult(null);
    };

    const importCsv = async (e?: React.FormEvent) => {
        e?.preventDefault?.();
        setCsvResult(null);
        setCsvLoading(true);
        try {
            const input = document.getElementById('csv-input') as HTMLInputElement | null;
            if (!input || !input.files || input.files.length === 0) { setCsvResult({ success: 0, failed: 0, errors: ['ファイルが選択されていません。'] }); return; }
            const file = input.files[0];
            const text = await file.text();
            const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
            if (lines.length <= 1) { setCsvResult({ success: 0, failed: 0, errors: ['CSV にデータがありません。ヘッダ行を含めてください。'] }); return; }
            const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
            const required = ['name', 'student_id']; for (const r of required) if (!headers.includes(r)) { setCsvResult({ success: 0, failed: 0, errors: [`CSV のヘッダに "${r}" が見つかりません。`] }); return; }
            const rows = lines.slice(1).map((ln) => parseCSVLine(ln));
            const payloads = rows.map((row, idx) => { const obj: any = {}; headers.forEach((h, i) => { obj[h] = row[i] ?? '' }); return { idx: idx + 2, data: obj }; });

            const results = await Promise.allSettled(payloads.map((p) => axios.post('/api/member/', p.data)));
            let success = 0; const errors: any[] = []; results.forEach((r, i) => { if (r.status === 'fulfilled') success += 1; else { const msg = (r as PromiseRejectedResult).reason?.response?.data?.detail || (r as PromiseRejectedResult).reason?.message || '登録に失敗しました。'; errors.push(`行 ${payloads[i].idx}: ${String(msg)}`); } });
            setCsvResult({ success, failed: errors.length, errors });
        } catch (err: any) {
            console.error(err);
            if (err?.response?.status !== 401) {
                setCsvResult({ success: 0, failed: 0, errors: [err?.message || 'CSV の読み込みに失敗しました。'] });
            }
        }
        finally { setCsvLoading(false); }
    };

    const onSubmit = async (data: FormData) => {
        setApiError("");
        setApiSuccess("");
        try {
            const payload = {
                name: data.name,
                student_id: data.student_id,
            };

            const res = editingMemberId === null
                ? await axios.post("/api/member/", payload)
                : await axios.patch(`/api/member/${editingMemberId}/`, payload);

            if (res.status >= 200 && res.status < 300) {
                setApiSuccess(editingMemberId === null ? "メンバーを登録しました。" : "メンバー情報を更新しました。" );
                reset({ name: "", student_id: "", email: "" });
                setEditingMemberId(null);
                await fetchMembers();
            } else {
                setApiError("登録に失敗しました。サーバーの応答を確認してください。" );
            }
        } catch (err: any) {
            console.error(err);
            if (err?.response?.status !== 401) {
                const msg = err?.response?.data?.message || err?.message || "登録に失敗しました。";
                setApiError(String(msg));
            }
        }
    };

    const handleEditMember = (member: MemberData) => {
        setEditingMemberId(member.id);
        setValue("name", member.name);
        setValue("student_id", member.student_id);
        setValue("email", "");
        setApiError("");
        setApiSuccess("");
    };

    const handleCancelEdit = () => {
        setEditingMemberId(null);
        reset({ name: "", student_id: "", email: "" });
    };

    const handleDeleteMember = async (memberId: number) => {
        if (!window.confirm("このメンバーを削除しますか？")) {
            return;
        }

        try {
            const res = await axios.delete(`/api/member/${memberId}/`);
            if (res.status === 204) {
                setApiSuccess("メンバーを削除しました。" );
                await fetchMembers();
            }
        } catch (err: any) {
            console.error(err);
            if (err?.response?.status !== 401) {
                const msg = err?.response?.data?.detail || err?.message || "削除に失敗しました。";
                setApiError(String(msg));
            }
        }
    };

    const fetchLoanLogs = async () => {
        setLogsError("");
        try {
            const res = await axios.get("/api/equipment/loan-logs/");
            setLoanLogs(res.data || []);
        } catch (err: any) {
            console.error(err);
            if (err?.response?.status !== 401) {
                setLogsError(err?.response?.data?.detail || "貸出記録の取得に失敗しました。");
            }
        }
    };

    return (
        <Container component="main" maxWidth="xl" sx={{ py: 4 }}>
            <CssBaseline />

            {/* ヘッダーエリア：右端にログアウトボタンを配置 */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography component="h1" variant="h4" fontWeight="bold" color="primary.main">
                        管理者ダッシュボード
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        メンバーの個別登録・一括管理、および機材の貸出状況の確認ができます。
                    </Typography>
                </Box>
                {/* ログアウトボタン */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                >
                    ログアウト
                </Button>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 0.5, textAlign: "center" }}
                    >
                        ※ 画面遷移で自動的にログアウト
                    </Typography>
                </Box>
            </Box>

            {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
            {apiSuccess && <Alert severity="success" sx={{ mb: 2 }}>{apiSuccess}</Alert>}

            <Grid container spacing={3}>
                {/* 左側：登録エリア */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={3}>

                        {/* 手動登録カード */}
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <PersonAddIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">個別メンバー登録</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
                                    <TextField
                                        placeholder="氏名"
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                        {...register("name", { required: "必須入力です。" })}
                                        error={Boolean(errors.name)}
                                        helperText={errors.name?.message?.toString() || ""}
                                    />
                                    <TextField
                                        placeholder="学籍番号"
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                        {...register("student_id", {
                                            required: "必須入力です。",
                                            pattern: { value: /^[A-Za-z]\d{5}$/, message: "学籍番号の形式が不正です。" },
                                        })}
                                        error={Boolean(errors.student_id)}
                                        helperText={errors.student_id?.message?.toString() || "例: a00000"}
                                    />
                                    <Button type="submit" variant="contained" fullWidth sx={{ mt: 1 }}>
                                        {editingMemberId === null ? "メンバーを登録" : "内容を更新"}
                                    </Button>
                                    {editingMemberId !== null && (
                                        <Button variant="outlined" color="inherit" onClick={handleCancelEdit}>
                                            編集をキャンセル
                                        </Button>
                                    )}
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">登録済みメンバー一覧</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {memberLoading ? "読み込み中..." : `${members.length}人`}
                                    </Typography>
                                </Box>

                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, overflow: 'auto' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>氏名</TableCell>
                                                <TableCell>学籍番号</TableCell>
                                                <TableCell align="right">操作</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {members.map((member) => (
                                                <TableRow key={member.id} hover>
                                                    <TableCell>{member.name}</TableCell>
                                                    <TableCell>{member.student_id}</TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                                            <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditMember(member)}>
                                                                編集
                                                            </Button>
                                                            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteMember(member.id)}>
                                                                削除
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {members.length === 0 && !memberLoading && (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            メンバーが登録されていません。
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>

                        {/* CSV登録カード */}
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <CloudUploadIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">CSVから一括登録</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Box component="form" onSubmit={importCsv} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <input
                                        id="csv-input"
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={handleCsvFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => document.getElementById('csv-input')?.click()}
                                        >
                                            ファイル選択
                                        </Button>
                                        <Typography variant="body2" color={csvFileName ? "text.primary" : "text.secondary"} noWrap sx={{ maxWidth: 200 }}>
                                            {csvFileName || "ファイルが選択されていません"}
                                        </Typography>
                                    </Stack>

                                    <Button
                                        variant="contained"
                                        type="submit"
                                        color="secondary"
                                        disabled={csvLoading || !csvFileName}
                                        fullWidth
                                    >
                                        {csvLoading ? '読み込み中...' : 'CSV から一括インポート'}
                                    </Button>
                                </Box>

                                {csvResult && (
                                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            処理結果: 成功 {csvResult.success} 件 / 失敗 {csvResult.failed} 件
                                        </Typography>
                                        {csvResult.errors.length > 0 && (
                                            <Box sx={{ mt: 1, maxHeight: 120, overflowY: 'auto' }}>
                                                {csvResult.errors.map((err, i) => (
                                                    <Typography key={i} variant="caption" color="error" display="block">
                                                        {err}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                    </Stack>
                </Grid>

                {/* 右側：貸出記録エリア */}
                <Grid xs={12} md={7}>
                    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StorageIcon color="primary" />
                                    <Typography variant="h6" fontWeight="bold">機材貸出記録履歴</Typography>
                                </Box>
                                <Button variant="contained" size="small" onClick={fetchLoanLogs}>
                                    ログ最新化
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />

                            {logsError && <Alert severity="error" sx={{ mb: 2 }}>{logsError}</Alert>}

                            {loanLogs.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 700, flexGrow: 1 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: 'background.neutral', fontWeight: 'bold', minWidth: 120 }}>備品名</TableCell>
                                                <TableCell sx={{ bgcolor: 'background.neutral', fontWeight: 'bold', minWidth: 100 }}>学籍番号</TableCell>
                                                <TableCell sx={{ bgcolor: 'background.neutral', fontWeight: 'bold', minWidth: 120 }}>氏名</TableCell>
                                                <TableCell sx={{ bgcolor: 'background.neutral', fontWeight: 'bold', minWidth: 130 }}>日時</TableCell>
                                                <TableCell sx={{ bgcolor: 'background.neutral', fontWeight: 'bold', minWidth: 100 }}>操作</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loanLogs.map((log) => (
                                                <TableRow key={log.id} hover>
                                                    <TableCell>{log.equipment_name}</TableCell>
                                                    <TableCell>{log.borrower_student_id}</TableCell>
                                                    <TableCell>{log.borrower_name}</TableCell>
                                                    <TableCell>{new Date(log.timestamp).toLocaleString('ja-JP')}</TableCell>
                                                    <TableCell>{log.action_label || log.action}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, p: 4, border: '1px dashed text.secondary', borderRadius: 1, bgcolor: 'action.hover' }}>
                                    <Typography color="text.secondary">
                                        「ログ最新化」ボタンを押してデータを読み込んでください。
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}