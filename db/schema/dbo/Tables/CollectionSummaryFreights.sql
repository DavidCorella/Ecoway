CREATE TABLE [dbo].[CollectionSummaryFreights] (
    [id]          UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [summary_id]  UNIQUEIDENTIFIER NOT NULL,
    [ticket_id]   UNIQUEIDENTIFIER NULL,
    [quantity]    INT              DEFAULT ((1)) NOT NULL,
    [cost]        DECIMAL (18, 2)  NOT NULL,
    [description] VARCHAR (200)    NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_CollectionSummaryFreights_Summaries] FOREIGN KEY ([summary_id]) REFERENCES [dbo].[CollectionSummaries] ([id]),
    CONSTRAINT [FK_CollectionSummaryFreights_Tickets] FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[Tickets] ([id])
);


GO

