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

    DashboardAdmin: undefined;

    Companies: undefined;
    Users: undefined;
    Sales: undefined;
    Product: undefined;
    ProductSummary:{ cart: any[] };

    DashboardRSM: undefined;
    DashboardASM: undefined;
    DashboardDistributor: undefined;
    DashboardDealer: undefined;
    DashboardSubDealer: undefined;
    DashboardSalesman: undefined;


    DashboardHome: undefined;
    SaleOrders: undefined;

    SaleOrderStart: undefined;
    SaleOrderEntry: undefined;
    SaleOrderItemSelect: undefined;
    SaleOrderItemDetail: undefined;
    SaleOrderApprove: undefined;
};
