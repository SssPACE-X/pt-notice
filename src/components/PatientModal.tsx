"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface PatientModalProps {
    onClose: () => void;
    editPatient?: { id: string; name: string; reg_no: string } | null;
}

export default function PatientModal({ onClose, editPatient }: PatientModalProps) {
    const isEdit = !!editPatient;
    const [name, setName] = useState(editPatient?.name || "");
    const [regNo, setRegNo] = useState(editPatient?.reg_no || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto focus on name input
        if (nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (regNo.length !== 8) {
            alert("등록번호는 8자리 숫자여야 합니다.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEdit && editPatient) {
                // 수정 모드
                const { error } = await supabase.from("patients").update(
                    { name, reg_no: regNo }
                ).eq("id", editPatient.id);

                if (error) {
                    if (error.code === '23505') {
                        alert("이미 존재하는 등록번호입니다.");
                    } else {
                        throw error;
                    }
                } else {
                    onClose();
                }
            } else {
                // 등록 모드
                const { error } = await supabase.from("patients").insert([
                    { name, reg_no: regNo, status: "waiting" }
                ]);

                if (error) {
                    if (error.code === '23505') {
                        alert("이미 존재하는 등록번호입니다.");
                    } else {
                        throw error;
                    }
                } else {
                    await fetch("/api/push/notify", {
                        method: "POST",
                        body: JSON.stringify({
                            title: "신규 환자 등록",
                            body: `${name} 환자가 대기 명단에 등록되었습니다.`,
                        }),
                        headers: { "Content-Type": "application/json" }
                    });
                    onClose();
                }
            }
        } catch (error) {
            console.error("Error registering patient:", error);
            alert("등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 8) setRegNo(val);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} className="animate-fade-in">
                <h2 style={styles.title}>{isEdit ? "환자 수정" : "환자 등록"}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>성함</label>
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="홍길동"
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>등록번호 (숫자 8자리)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{8}"
                            value={regNo}
                            onChange={handleRegNoChange}
                            required
                            style={styles.input}
                            placeholder="12345678"
                        />
                    </div>
                    <div style={styles.actions}>
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                            취소
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (isEdit ? "수정 중..." : "등록 중...") : (isEdit ? "수정" : "등록")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed" as const,
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "1rem",
    },
    modal: {
        backgroundColor: "var(--card-bg)",
        padding: "2rem",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    },
    title: {
        marginTop: 0,
        marginBottom: "1.5rem",
        fontSize: "1.25rem",
    },
    formGroup: {
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column" as const,
        gap: "0.5rem",
    },
    label: {
        fontSize: "0.9rem",
        fontWeight: 500,
        color: "var(--text-muted)",
    },
    input: {
        width: "100%",
    },
    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "0.75rem",
        marginTop: "2rem",
    }
};
