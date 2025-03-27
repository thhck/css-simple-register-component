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
  PodStore,
  PodCreator,
  IdentifierGenerator,
  BadRequestHttpError,
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
  accountStore: AccountStore;
  cookieStore: CookieStore;
  passwordStore: PasswordStore;
  passwordRoute: PasswordIdRoute;
  podCreator: PodCreator;
  podStore: PodStore;
  identifierGenerator: IdentifierGenerator;
}

type OutType = {
  resource: string;
}
export class CreatePasswordLoginHandler extends ResolveLoginHandler implements JsonView {
  private readonly passwordStore: PasswordStore;
  private readonly passwordRoute: PasswordIdRoute;
  private readonly podCreator: PodCreator;
  private readonly podStore: PodStore;
  private readonly identifierGenerator: IdentifierGenerator;
  public constructor(args: CreatePasswordLoginHandlerArgs) {
    super(args.accountStore, args.cookieStore);
    this.passwordStore = args.passwordStore;
    this.passwordRoute = args.passwordRoute;
    this.podCreator = args.podCreator;
    this.podStore = args.podStore;
    this.identifierGenerator = args.identifierGenerator;
  }

  public async getView(): Promise<JsonRepresentation<EmptyObject>> {
    return { json: {} };
  }

  public async login(input: JsonInteractionHandlerInput): Promise<JsonRepresentation<LoginOutputType>> {
    const { json } = input;
    const accountId = await this.accountStore.create();

    // validate the input
    const { email, password, name } = await validateWithError(inSchema, json);
    // we need to check if the pod already exists, so if first
    // because otherwise we would have to delete the created account
    // if the pod creation fails
    const podId = await this.identifierGenerator.generate(name);
    let res = await this.podStore.findByBaseUrl(podId.path)
    if (res) throw new BadRequestHttpError('Pod already exists');

  const passwordId = await this.passwordStore.create(email, accountId, password);
    const resource = this.passwordRoute.getPath({ accountId, passwordId });

    // If we ever want to add email verification this would have to be checked separately
    await this.passwordStore.confirmVerification(passwordId);


    await this.podCreator.handleSafe({
      accountId,
      name,
    });

    return { json: { accountId } };
  }
}
