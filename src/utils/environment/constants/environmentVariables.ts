export default class ENV {
  // Portal environment variables

  /*
   * @ Portal Environment Variables
   * @ Description: This class contains all the environment variables required for the portal
   * It can have framework specific environment variables such as api, database, etc.
   */

  public static APP_VERSION = process.env.APP_VERSION!;

  // Portal environment variables
  public static PORTAL_BASE_URL = process.env.PORTAL_BASE_URL!;
  public static PORTAL_USERNAME = process.env.PORTAL_USERNAME!;
  public static PORTAL_PASSWORD = process.env.PORTAL_PASSWORD!;

  // API environment variables
  public static API_BASE_URL = process.env.API_BASE_URL!;
  public static TOKEN_USERNAME = process.env.TOKEN_USERNAME!;
  public static TOKEN_PASSWORD = process.env.TOKEN_PASSWORD!;

  // Database environment variables
  public static SERVER = process.env.SERVER!;
  public static DATABASE = process.env.DATABASE!;
  public static DATABASE_SCHEMA = process.env.DATABASE_SCHEMA!;
  public static PORT = process.env.PORT!;
  public static AZURE_DB_ENDPOINT = process.env.AZURE_DB_ENDPOINT!;

  // SMTP environment variables
  public static SMTP_USERNAME = process.env.SMTP_USERNAME!;
  public static SMTP_PASSWORD = process.env.SMTP_PASSWORD!;
  public static SMTP_HOST = process.env.SMTP_HOST!;
  public static SMTP_PORT = process.env.SMTP_PORT!;
}
