"use client";

import { useState, useEffect } from "react";
import PatientModal from "./PatientModal";

interface HeaderProps {
    inProgressCount: number;
    waitingCount: number;
}

export default function Header({ inProgressCount, waitingCount }: HeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [maxCapacity, setMaxCapacity] = useState(8);

    useEffect(() => {
        // Check initial admin mode & capacity from localStorage
        const adminFlag = localStorage.getItem("isAdmin") === "true";
        setIsAdmin(adminFlag);

        const savedCapacity = localStorage.getItem("maxCapacity");
        if (savedCapacity) {
            setMaxCapacity(parseInt(savedCapacity, 10));
        }
    }, []);

    const toggleAdmin = () => {
        const newAdmin = !isAdmin;
        setIsAdmin(newAdmin);
        localStorage.setItem("isAdmin", String(newAdmin));
        if (newAdmin) {
            // Subscribe to push if becoming admin
            subscribeToPush();
        }
    };

    const handleCapacityClick = () => {
        if (!isAdmin) return;
        const newCap = prompt("최대 정원을 입력하세요:", String(maxCapacity));
        if (newCap && !isNaN(Number(newCap))) {
            const cap = Number(newCap);
            setMaxCapacity(cap);
            localStorage.setItem("maxCapacity", String(cap));
        }
    };

    const subscribeToPush = async () => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                });
                await fetch("/api/push/subscribe", {
                    method: "POST",
                    body: JSON.stringify(sub),
                    headers: { "Content-Type": "application/json" }
                });
                alert("관리자 알림이 활성화되었습니다.");
            } catch (e) {
                console.error("Push subscription failed:", e);
            }
        }
    };

    return (
        <>
            <header style={styles.header}>
                <div style={styles.topRow}>
                    <h1 style={styles.title}>
                        <span onClick={toggleAdmin} style={{ cursor: "pointer", opacity: isAdmin ? 1 : 0.7 }}>
                            {isAdmin ? "🛠" : "🏥"}
                        </span> 집중재활 현황
                    </h1>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        환자등록
                    </button>
                </div>
                <div style={styles.bottomRow}>
                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>시행중</span>
                        <span
                            style={{
                                ...styles.statValue,
                                cursor: isAdmin ? 'pointer' : 'default',
                                textDecoration: isAdmin ? 'underline' : 'none',
                                textUnderlineOffset: '4px'
                            }}
                            onClick={handleCapacityClick}
                            title={isAdmin ? "최대 정원 수정" : ""}
                        >
                            {inProgressCount}/{maxCapacity}명
                        </span>
                    </div>
                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>대기중</span>
                        <span style={styles.statValue}>{waitingCount}명</span>
                    </div>
                </div>
            </header>

            {isModalOpen && (
                <PatientModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
}

const styles = {
    header: {
        position: "sticky" as const,
        top: 0,
        backgroundColor: "var(--card-bg)",
        borderBottom: "1px solid var(--border-color)",
        padding: "1rem",
        zIndex: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    topRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
    },
    title: {
        fontSize: "1.25rem",
        fontWeight: "bold",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
    },
    bottomRow: {
        display: "flex",
        gap: "1rem",
    },
    statBox: {
        flex: 1,
        backgroundColor: "var(--bg-color)",
        padding: "0.75rem",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statLabel: {
        color: "var(--text-muted)",
        fontSize: "0.9rem",
        fontWeight: 500,
    },
    statValue: {
        fontSize: "1.1rem",
        fontWeight: "bold",
        color: "var(--primary)",
    }
};
