"use strict";
module.exports = { async up(q,S){ await q.addColumn("users","mfaEnabled",{type:S.BOOLEAN,allowNull:false,defaultValue:false}); await q.addColumn("users","mfaSecretEncrypted",{type:S.TEXT,allowNull:true}); }, async down(q){await q.removeColumn("users","mfaSecretEncrypted");await q.removeColumn("users","mfaEnabled");} };
