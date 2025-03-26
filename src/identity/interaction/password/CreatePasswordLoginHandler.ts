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
  ResolveLoginHandler,
  CookieStore,
  EmptyObject,
  LoginOutputType,
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
  cookieStore: CookieStore;
}

type OutType = {
  resource: string;
}
export class CreatePasswordLoginHandler extends ResolveLoginHandler implements JsonView {
  private readonly createAccountHandler: CreateAccountHandler;
  private readonly createPodHandler: CreatePodHandler;
  // private readonly accountStore: AccountStore;
  private readonly passwordStore: PasswordStore;
  private readonly passwordRoute: PasswordIdRoute;
  public constructor(args: CreatePasswordLoginHandlerArgs) {
    super(args.accountStore, args.cookieStore);
    this.createAccountHandler = args.createAccountHandler;
    this.createPodHandler = args.createPodHandler;
    // this.accountStore = args.accountStore;
    this.passwordStore = args.passwordStore;
    this.passwordRoute = args.passwordRoute;
  }

  public async getView(): Promise<JsonRepresentation<EmptyObject>> {
    return { json: {}};
  }

  public async login({json}: JsonInteractionHandlerInput): Promise<JsonRepresentation<LoginOutputType>> {
    const accountId = await this.accountStore.create();
 // const accountId = await this.accountStore.create();

    const validatedData = await validateWithError(inSchema, json) as InputData;
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
    const accountUrl = `http://localhost:3000/.account/account/${accountId}`;


    return { json: { accountId }};
  }
}
