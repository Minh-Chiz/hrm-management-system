// ─── Mở rộng Express Request để chứa thông tin user sau khi xác thực ──────────
declare namespace Express {
  interface Request {
    user?: {
      id: number;
      email: string;
      role: string;
      name: string;
    };
  }
}
