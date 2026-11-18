import { sequelize } from "./sequelize.js";
import { initRoleModel, Role } from "../modules/roles/role.model.js";
import { initUserModel, User } from "../modules/users/user.model.js";
import { initSessionModel, Session } from "../modules/sessions/session.model.js";
import { initAuditLogModel, AuditLog } from "../shared/audit/audit-log.model.js";
import { initPasswordHistoryModel, PasswordHistory } from "../shared/security/password-history.model.js";
import { initPermissionModel, Permission } from "../modules/roles/permission.model.js";

// Un único registro de modelos evita crear definiciones diferentes de las
// mismas tablas en distintos módulos.
initRoleModel(sequelize);
initUserModel(sequelize);
initSessionModel(sequelize);
initAuditLogModel(sequelize);
initPasswordHistoryModel(sequelize);
initPermissionModel(sequelize);

Role.hasMany(User, { foreignKey: "roleId", as: "users" });
User.belongsTo(Role, { foreignKey: "roleId", as: "role" });
User.hasMany(Session, { foreignKey: "userId", as: "sessions" });
Session.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(PasswordHistory, { foreignKey: "userId", as: "passwordHistory" });
Role.belongsToMany(Permission, { through: "role_permissions", foreignKey: "roleId", otherKey: "permissionId", as: "permissions" });
Permission.belongsToMany(Role, { through: "role_permissions", foreignKey: "permissionId", otherKey: "roleId", as: "roles" });

export { Role, User, Session, AuditLog, PasswordHistory, Permission };
