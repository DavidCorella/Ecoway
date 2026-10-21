CREATE TABLE [dbo].[DeviceLoginAttempts] (
    [device_id]       UNIQUEIDENTIFIER NOT NULL,
    [failed_attempts] INT              DEFAULT ((0)) NOT NULL,
    [locked_until]    DATETIME         NULL,
    [last_attempt_at] DATETIME         DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([device_id] ASC)
);


GO

