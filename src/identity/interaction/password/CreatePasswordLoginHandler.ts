import { boolean, object, string } from 'yup';
import {
  getLoggerFor,
  assertOidcInteraction,
  finishInteraction,
  type JsonRepresentation,
  JsonInteractionHandler,
  type JsonInteractionHandlerInput,
  JsonView,
  parseSchema,
  validateWithError,
  CreateAccountHandler,
  CreatePodHandler,
  AccountStore,
  PasswordStore,
  PasswordIdRoute,
  assertAccountId,
} from '@solid/community-server';

interface InputData {
  email: string;
  password: string;
  name: string;
  remember: boolean;
}

const inSchema = object({
  email: string().trim().email().lowercase().required(),
  password: string().trim().min(1).required(),
  name: string().trim().min(1).required(),
  remember: boolean().default(false),
});

export interface CreatePasswordLoginHandlerArgs {
  createAccountHandler: CreateAccountHandler;
  createPodHandler: CreatePodHandler;
  accountStore: AccountStore;
  passwordStore: PasswordStore;
  passwordRoute: PasswordIdRoute;
}

/**
 * Handles the creation of a new account and pod with the provided credentials.
 * Can be used both with and without OIDC interactions.
 */
export class CreatePasswordLoginHandler extends JsonInteractionHandler implements JsonView {
  protected readonly logger = getLoggerFor(this);

  private readonly createAccountHandler: CreateAccountHandler;
  private readonly createPodHandler: CreatePodHandler;
  private readonly accountStore: AccountStore;
  private readonly passwordStore: PasswordStore;
  private readonly passwordRoute: PasswordIdRoute;
  public constructor(args: CreatePasswordLoginHandlerArgs) {
    super();
    this.createAccountHandler = args.createAccountHandler;
    this.createPodHandler = args.createPodHandler;
    this.accountStore = args.accountStore;
    this.passwordStore = args.passwordStore;
    this.passwordRoute = args.passwordRoute;
  }

  public async getView(): Promise<JsonRepresentation> {
    return { json: parseSchema(inSchema) };
  }

  public async handle({ json }: JsonInteractionHandlerInput): Promise<JsonRepresentation> {
    const validatedData = await validateWithError(inSchema, json) as InputData;

  const accountId = await this.accountStore.create();
    // assertAccountId(accountId);
    // Create new account
    // const accountId = await this.accountStore.create();

    // Create password login for the account

    const { email, password } = await validateWithError(inSchema, json);
    const passwordId = await this.passwordStore.create(email, accountId, password);
    const resource = this.passwordRoute.getPath({ accountId, passwordId });

    // If we ever want to add email verification this would have to be checked separately
    await this.passwordStore.confirmVerification(passwordId);

    // return { json: { resource } };
    // Create new pod for the account
    const podResponse = await this.createPodHandler.handle({
      accountId,
      json: {
        name: validatedData.name,
      },
    } as JsonInteractionHandlerInput);

    // TODO: Need to get the account URL from the server
    const accountUrl = `/accounts/${accountId}`;



    // If not an OIDC interaction, return the account URL and info
    return {
      json: {
        location: accountUrl,
        accountId,
        accountUrl,
        pod: podResponse.json.pod,
      },
    };
  }
}
