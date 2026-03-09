"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import WaitingList from "@/components/WaitingList";
import AssignedList from "@/components/AssignedList";
import DischargeList from "@/components/DischargeList";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [patients, setPatients] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        console.log("Service Worker registered.", reg);
      });
    }

    fetchInitialData();

    // Subscribe to patients table changes
    const patientSub = supabase
      .channel('public:patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        handlePatientChange(payload);
      })
      .subscribe();

    // Subscribe to treatment_checks table changes
    const checkSub = supabase
      .channel('public:treatment_checks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treatment_checks' }, (payload) => {
        handleCheckChange(payload);
      })
      .subscribe();

    // Re-fetch data when page becomes visible (mobile background → foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInitialData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Re-fetch data when network reconnects
    const handleOnline = () => {
      fetchInitialData();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      supabase.removeChannel(patientSub);
      supabase.removeChannel(checkSub);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('treatment_checks').select('*')
      ]);

      if (pRes.data) setPatients(pRes.data);
      if (cRes.data) setChecks(cRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setPatients(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setPatients(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
    } else if (payload.eventType === 'DELETE') {
      setPatients(prev => prev.filter(p => p.id !== payload.old.id));
    }
  };

  const handleCheckChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setChecks(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setChecks(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
    } else if (payload.eventType === 'DELETE') {
      setChecks(prev => prev.filter(c => c.id !== payload.old.id));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const assignedPatients = patients.filter(p => p.status === 'assigned');
  const monWedPatients = assignedPatients.filter(p => p.schedule === 'mon_wed');
  const tueThuPatients = assignedPatients.filter(p => p.schedule === 'tue_thu');
  const dcPatients = patients.filter(p => p.status === 'discharged');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        inProgressCount={assignedPatients.length}
        waitingCount={waitingPatients.length}
      />
      <main style={{ padding: '1rem', flex: 1 }}>
        <AssignedList
          title="월/수"
          scheduleKey="mon_wed"
          patients={monWedPatients}
          checks={checks}
        />
        <AssignedList
          title="화/목"
          scheduleKey="tue_thu"
          patients={tueThuPatients}
          checks={checks}
        />
        <WaitingList patients={waitingPatients} />
        <DischargeList patients={dcPatients} />
      </main>
    </div>
  );
}
