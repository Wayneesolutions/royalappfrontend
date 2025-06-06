// src/navigation/types.ts (or similar)
export type RootStackParamList = {
    Splash: undefined;
    SignIn: undefined;
    ForgotPasswordMethod: undefined;
    PasswordRecoveryEmail: undefined;
    EmailVerification: { email: string };
    OTPVerification: undefined;
    SuccessMessage: undefined;
    ErrorMessage: undefined;
    DashboardHome: undefined;
    SaleOrders: undefined;

    SaleOrderStart: undefined;
    SaleOrderEntry: undefined;
    SaleOrderItemSelect: undefined;
    SaleOrderItemDetail: undefined;
    SaleOrderApprove: undefined;
};
