"use strict";
module.exports = {
  async up(q, S) {
    await q.addColumn("users", "mfaRecoveryCodesHash", {
      type: S.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },
  async down(q) {
    await q.removeColumn("users", "mfaRecoveryCodesHash");
  },
};
