module {
    public type Role = {
        #Installer;
        #Producer;
    };

    public type Category = {
        categoryType : Nat;
        subtype : Nat;
    };

    public type Workspace = {
        title : Text;
        image : Text;
        qrCodes : [Text];
        models : [Text];
    };

    public type Company = {
        id : Nat;
        brand : Text;
        contacts : Text;
        bio : Text;
        category : Category;
        workspaces : [Workspace];
    };

    public type QRInstallation = {
        qrCode : Text;
        timestamp : Nat64;
    };

    public type Review = {
        rank : Nat;
        description : Text;
        author : Text;
        uuid : Text;
    };

    public type InstallerData = {
        qrInstalled : [QRInstallation];
        reviews : [Review];
        level : Nat;
    };

    public type ProducerData = {
        qrCreated : [Text];
    };

    public type User = {
        id : Nat;
        email : Text;
        firstName : Text;
        lastName : Text;
        photo : Text;
        contacts : Text;
        companyId : ?Nat;
        bio : Text;
        category : Category;
        roles : [Role];
        installerData : ?InstallerData;
        producerData : ?ProducerData;
    };
};
