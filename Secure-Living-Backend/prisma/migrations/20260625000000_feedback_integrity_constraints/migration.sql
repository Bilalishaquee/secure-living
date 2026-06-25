-- Client feedback integrity constraints.
-- PostgreSQL allows multiple NULL values in UNIQUE indexes, which keeps optional fields usable.

CREATE UNIQUE INDEX IF NOT EXISTS "Property_propertyCode_key" ON "Property"("propertyCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Unit_propertyId_unitNumber_key" ON "Unit"("propertyId", "unitNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Visitor_organizationId_phone_key" ON "Visitor"("organizationId", "phone");
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceProvider_userId_key" ON "ServiceProvider"("userId");
