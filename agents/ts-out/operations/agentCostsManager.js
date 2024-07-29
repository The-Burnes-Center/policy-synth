import { QueryTypes } from "sequelize";
import { sequelize } from "../dbModels/index.js";
export class AgentCostManager {
    async getDetailedAgentCosts(agentId) {
        try {
            const results = await sequelize.query(`
        WITH RECURSIVE agent_hierarchy AS (
          SELECT id, parent_agent_id, name
          FROM ps_agents
          WHERE id = :agentId
          UNION ALL
          SELECT a.id, a.parent_agent_id, a.name
          FROM ps_agents a
          JOIN agent_hierarchy ah ON a.parent_agent_id = ah.id
        )
        SELECT
          mu.created_at,
          ah.name as agent_name,
          am.name as ai_model_name,
          mu.token_in_count,
          mu.token_out_count,
          (mu.token_in_count * CAST(am.configuration#>>'{prices,costInTokensPerMillion}' AS FLOAT) / 1000000.0) as cost_in,
          (mu.token_out_count * CAST(am.configuration#>>'{prices,costOutTokensPerMillion}' AS FLOAT) / 1000000.0) as cost_out,
          ((mu.token_in_count * CAST(am.configuration#>>'{prices,costInTokensPerMillion}' AS FLOAT) +
            mu.token_out_count * CAST(am.configuration#>>'{prices,costOutTokensPerMillion}' AS FLOAT)) / 1000000.0) as total_cost
        FROM agent_hierarchy ah
        JOIN "AgentModels" am_join ON ah.id = am_join.agent_id
        JOIN ps_ai_models am ON am_join.ai_model_id = am.id
        JOIN ps_model_usage mu ON mu.model_id = am.id AND mu.agent_id = ah.id
        ORDER BY mu.created_at DESC
      `, {
                replacements: { agentId },
                type: QueryTypes.SELECT,
            });
            return results.map((row) => ({
                createdAt: row.created_at,
                agentName: row.agent_name,
                aiModelName: row.ai_model_name,
                tokenInCount: parseInt(row.token_in_count),
                tokenOutCount: parseInt(row.token_out_count),
                costIn: parseFloat(row.cost_in),
                costOut: parseFloat(row.cost_out),
                totalCost: parseFloat(row.total_cost)
            }));
        }
        catch (error) {
            throw new Error("Error calculating detailed agent costs: " + error);
        }
    }
    async getAgentCosts(agentId) {
        try {
            const results = await sequelize.query(`
        WITH RECURSIVE agent_hierarchy AS (
          SELECT id, parent_agent_id, 0 as level
          FROM ps_agents
          WHERE id = :agentId
          UNION ALL
          SELECT a.id, a.parent_agent_id, ah.level + 1
          FROM ps_agents a
          JOIN agent_hierarchy ah ON a.parent_agent_id = ah.id
        )
        SELECT
          ah.id as agent_id,
          ah.level,
          COALESCE(SUM(
            (COALESCE(mu.token_in_count, 0) * COALESCE(CAST(am.configuration#>>'{prices,costInTokensPerMillion}' AS FLOAT), 0) +
             COALESCE(mu.token_out_count, 0) * COALESCE(CAST(am.configuration#>>'{prices,costOutTokensPerMillion}' AS FLOAT), 0)) / 1000000.0
          ), 0) as agent_cost
        FROM agent_hierarchy ah
        LEFT JOIN "AgentModels" am_join ON ah.id = am_join.agent_id
        LEFT JOIN ps_ai_models am ON am_join.ai_model_id = am.id
        LEFT JOIN ps_model_usage mu ON mu.model_id = am.id AND mu.agent_id = ah.id
        GROUP BY ah.id, ah.level
        ORDER BY ah.level, ah.id
        `, {
                replacements: { agentId },
                type: QueryTypes.SELECT,
            });
            const agentCosts = results.map((row) => ({
                agentId: row.agent_id,
                level: row.level,
                cost: parseFloat(row.agent_cost).toFixed(2),
            }));
            const totalCost = agentCosts
                .reduce((sum, agent) => sum + parseFloat(agent.cost), 0)
                .toFixed(2);
            return { agentCosts, totalCost };
        }
        catch (error) {
            throw Error("Error calculating agent costs: " + error);
        }
    }
    async getSingleAgentCosts(agentId) {
        try {
            const results = await sequelize.query(`
        SELECT
          COALESCE(SUM(
            (COALESCE(mu.token_in_count, 0) * COALESCE(CAST(am.configuration#>>'{prices,costInTokensPerMillion}' AS FLOAT), 0) +
             COALESCE(mu.token_out_count, 0) * COALESCE(CAST(am.configuration#>>'{prices,costOutTokensPerMillion}' AS FLOAT), 0)) / 1000000.0
          ), 0) as total_cost
        FROM ps_agents a
        LEFT JOIN "AgentModels" am_join ON a.id = am_join.agent_id
        LEFT JOIN ps_ai_models am ON am_join.ai_model_id = am.id
        LEFT JOIN ps_model_usage mu ON mu.model_id = am.id AND mu.agent_id = a.id
        WHERE a.id = :agentId
      `, {
                replacements: { agentId },
                type: QueryTypes.SELECT,
            });
            return results[0].total_cost;
        }
        catch (error) {
            throw "Error calculating agent costs: " + error;
        }
    }
}
//# sourceMappingURL=agentCostsManager.js.map