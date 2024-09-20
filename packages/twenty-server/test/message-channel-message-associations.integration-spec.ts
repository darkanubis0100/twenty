import request from 'supertest';

const client = request(`http://localhost:${APP_PORT}`);

describe('messageChannelMessageAssociationsResolver (integration)', () => {
  it('should find many messageChannelMessageAssociations', () => {
    const queryData = {
      query: `
        query messageChannelMessageAssociations {
          messageChannelMessageAssociations {
            edges {
              node {
                createdAt
                messageExternalId
                messageThreadExternalId
                direction
                id
                updatedAt
                deletedAt
                messageChannelId
                messageId
              }
            }
          }
        }
      `,
    };

    return client
      .post('/graphql')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .send(queryData)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(res.body.errors).toBeUndefined();
      })
      .expect((res) => {
        const data = res.body.data.messageChannelMessageAssociations;

        expect(data).toBeDefined();
        expect(Array.isArray(data.edges)).toBe(true);

        const edges = data.edges;

        if (edges.length > 0) {
          const messageChannelMessageAssociations = edges[0].node;

          expect(messageChannelMessageAssociations).toHaveProperty('createdAt');
          expect(messageChannelMessageAssociations).toHaveProperty(
            'messageExternalId',
          );
          expect(messageChannelMessageAssociations).toHaveProperty(
            'messageThreadExternalId',
          );
          expect(messageChannelMessageAssociations).toHaveProperty('direction');
          expect(messageChannelMessageAssociations).toHaveProperty('id');
          expect(messageChannelMessageAssociations).toHaveProperty('updatedAt');
          expect(messageChannelMessageAssociations).toHaveProperty('deletedAt');
          expect(messageChannelMessageAssociations).toHaveProperty(
            'messageChannelId',
          );
          expect(messageChannelMessageAssociations).toHaveProperty('messageId');
        }
      });
  });
});