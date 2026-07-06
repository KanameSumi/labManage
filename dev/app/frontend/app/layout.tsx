"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AppBar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ThemeProvider,
    Toolbar,
    Typography,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { defaultTheme } from "./theme";


declare module "@mui/material/styles" {
    // 指定を単純にするためにモバイルとPCの2つに限定する
    interface BreakpointOverrides {
        xs: false;
        sm: false;
        md: false;
        lg: false;
        xl: false;
        mobile: true;
        desktop: true;
    }
}

export default function InventoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    /** サイドバーの開閉を管理する */
    const [open, setOpen] = useState(false);
    const toggleDrawer = (open: boolean) => {
        setOpen(open);
    };

    /** 各種画面への遷移を管理する */
    const router = useRouter();

    // ログアウト処理
    const handleLogin = () => {
        router.replace("/login");
    };

    /** 開閉対象となるサイドバー本体 */
    const list = () => (
        <Box sx={{ width: 240 }}>
            <Toolbar />
            <Divider />
            <List
                sx={{
                    "& a": {
                        color: "#666",
                        textDecoration: "none",
                    },
                }}
            >
                <ListItem component="a" href="/members" disablePadding>
                    <ListItemButton>
                        <ListItemText primary="在室状況" />
                    </ListItemButton>
                </ListItem>
                <Divider />
                <ListItem component="a" href="/equipments" disablePadding>
                    <ListItemButton>
                        <ListItemText primary="備品貸出状況" />
                    </ListItemButton>
                </ListItem>
                <Divider sx={{ borderBottomWidth: 3 }} />
                <ListItem component="a" href="/login" disablePadding>
                    <ListItemButton>
                        <ListItemText primary="管理者画面" />
                    </ListItemButton>
                </ListItem>
                <Divider />
            </List>
        </Box>
    );

    return (
        <html lang="ja">
            <body>
                <ThemeProvider theme={defaultTheme}>
                    <Box sx={{ display: "flex" }}>
                        <AppBar position="fixed">
                            <Toolbar>
                                <IconButton onClick={() => toggleDrawer(true)}>
                                    <MenuIcon />
                                </IconButton>
                                <Typography
                                    variant="h6"
                                    noWrap
                                    component="div"
                                    sx={{ flexGrow: 1 }}
                                >
                                    研究室 管理システム
                                </Typography>
                                {/* <Button
                                    variant="contained"
                                    startIcon={<LogoutIcon />}
                                    onClick={() => handleLogin()}
                                >
                                    管理者ログイン
                                </Button> */}
                            </Toolbar>
                        </AppBar>
                        <Drawer open={open} onClose={() => toggleDrawer(false)} anchor="left">
                            {list()}
                        </Drawer>
                        <Box
                            component="main"
                            sx={{
                                flexGrow: 1,
                                p: 3,
                                // AppBarと被るため下にずらしている
                                marginTop: "64px",
                                width: "100%",
                                background: "white",
                            }}
                        >
                            {children}
                        </Box>
                        <Box
                            component='footer'
                            sx={{
                                width: '100%',
                                position: 'fixed',
                                textAlign: 'center',
                                bottom: 0,
                                background: "#246765",
                            }}
                        >
                            <Typography variant="caption" color="white">
                                ©2026 Lab Management System
                            </Typography>
                        </Box>
                    </Box>
                </ThemeProvider>
            </body>
        </html >
    );
}