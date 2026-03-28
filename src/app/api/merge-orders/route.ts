export async function POST(req: Request) {
  try {

    const body = await req.json();

    const res = await fetch(
      "https://admin.liquiditybars.com/admin/api/mergeOrders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    const text = await res.text();

    try {
      const data = JSON.parse(text);
      return Response.json(data);
    } catch {
      return Response.json({
        success: false,
        message: text
      });
    }

  } catch (error) {
    return Response.json({
      success: false,
      message: "Merge API failed"
    });
  }
}