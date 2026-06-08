// 1. Initial form state — add email
const [form, setForm] = useState({
  username: user.username ?? "",
  phone:    user.phone    ?? "",
  email:    user.email    ?? "",
  dob:      user.dob ? user.dob.slice(0, 10) : "",
  gender:   user.gender   ?? "",
  address:  user.address  ?? "",
});

// 2. handleEdit — add email to reset
setForm({
  username: user.username ?? "",
  phone:    user.phone    ?? "",
  email:    user.email    ?? "",
  dob:      user.dob ? user.dob.slice(0, 10) : "",
  gender:   user.gender   ?? "",
  address:  user.address  ?? "",
});

// 3. After save — update local state with email too
setUser(prev => ({
  ...prev,
  username: form.username || prev.username,
  phone:    form.phone    || prev.phone,
  email:    form.email    || prev.email,
  dob:      form.dob ? new Date(form.dob).toISOString() : prev.dob,
  gender:   form.gender   || prev.gender,
  address:  form.address  || prev.address,
}));