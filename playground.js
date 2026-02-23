function todayISO() {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }

  console.log(todayISO())