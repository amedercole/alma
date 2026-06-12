// Loads .env so modules that validate environment (e.g. @/server/config/env)
// can be imported in tests. In CI the variables are provided directly and this
// is a harmless no-op.
import "dotenv/config";
