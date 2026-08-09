exports.handler = async function (event) {
  const password = event.headers["x-admin-password"];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const token = process.env.NETLIFY_API_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID;

    const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/forms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const forms = await formsRes.json();
    const bookingForm = forms.find(f => f.name === "booking-enquiry");

    if (!bookingForm) {
      return { statusCode: 200, body: JSON.stringify({ bookings: [] }) };
    }

    const subsRes = await fetch(`https://api.netlify.com/api/v1/forms/${bookingForm.id}/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const submissions = await subsRes.json();

    const bookings = submissions.map(s => ({
      submittedAt: s.created_at,
      ...s.data
    })).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return { statusCode: 200, body: JSON.stringify({ bookings }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
