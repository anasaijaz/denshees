"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { AnimatePresence, motion } from "framer-motion";
import UpdateTemplate from "@/components/campaigns/builder/update-template";
import EmailStageNode from "@/components/campaigns/builder/email-stage-node";
import OutcomeNode from "@/components/campaigns/builder/outcome-node";

// Register custom node types
const nodeTypes = {
  emailStage: EmailStageNode,
  outcome: OutcomeNode,
};

const Builder = ({ campaign }) => {
  const { isLoading, data } = useSWR(
    `/api/pitches?campaign=${campaign}`,
    fetcher
  );
  
  // Fetch contacts data for analytics
  const { data: contactsData, isLoading: contactsLoading } = useSWR(
    `/api/contacts?campaign=${campaign}`,
    fetcher
  );
  
  const [selectedStage, setSelectedStage] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showEditor, setShowEditor] = useState(false);

  // Calculate stats from contacts data
  const stats = useMemo(() => {
    const contacts = contactsData || [];
    
    // Count contacts currently at each stage
    const contactsPerStage = {};
    contacts.forEach((contact) => {
      const stage = contact.stage || 0;
      if (stage > 0) {
        contactsPerStage[stage] = (contactsPerStage[stage] || 0) + 1;
      }
    });
    
    // Count replies per stage (replied_at_stage field or fallback to stage when status is REPLIED)
    const repliesPerStage = {};
    contacts.forEach((contact) => {
      if (contact.status === "REPLIED") {
        // Use replied_at_stage if available, otherwise use current stage
        const repliedStage = contact.replied_at_stage || contact.stage || 1;
        repliesPerStage[repliedStage] = (repliesPerStage[repliedStage] || 0) + 1;
      }
    });
    
    // Calculate outcome stats
    const totalContacts = contacts.length;
    const emailsReplied = contacts.filter((c) => c.status === "REPLIED").length;
    const emailsOpened = contacts.filter((c) => c.opened > 0 && c.status !== "REPLIED").length;
    
    // Get max stage from pitches data
    const maxStage = data?.items?.length || 1;
    
    // No reply = contacts who have received all emails but haven't replied or opened
    const noReply = contacts.filter(
      (c) => c.stage >= maxStage && c.status !== "REPLIED" && c.opened === 0
    ).length;
    
    return {
      contactsPerStage,
      repliesPerStage,
      emailsReplied,
      emailsOpened,
      noReply,
      totalContacts,
    };
  }, [contactsData, data]);

  // Create nodes and edges from stages data
  useEffect(() => {
    if (isLoading || !data) return;

    const stages = data.items.map((item) => item);
    const lastStageX = (stages.length - 1) * 300;

    // Create nodes for email stages
    const flowNodes = stages.map((stage, index) => ({
      id: `stage-${stage.id}`,
      type: "emailStage",
      position: { x: 0 + index * 300, y: 0 },
      data: {
        label: `Stage ${index + 1}`,
        stage: stage,
        isSelected: selectedStage?.id === stage.id,
        onClick: () => handleStageClick(stage),
        contactCount: stats.contactsPerStage[index + 1] || 0,
        replyCount: stats.repliesPerStage[index + 1] || 0,
        totalContacts: stats.totalContacts,
      },
      draggable: false,
    }));

    // Add outcome nodes after the last stage
    const outcomeY = 200;
    const outcomeSpacing = 200;
    const centerX = lastStageX;
    
    // Calculate percentages
    const repliedPercentage = stats.totalContacts > 0 ? Math.round((stats.emailsReplied / stats.totalContacts) * 100) : 0;
    const openedPercentage = stats.totalContacts > 0 ? Math.round((stats.emailsOpened / stats.totalContacts) * 100) : 0;
    const noReplyPercentage = stats.totalContacts > 0 ? Math.round((stats.noReply / stats.totalContacts) * 100) : 0;

    // Replied node
    flowNodes.push({
      id: "outcome-replied",
      type: "outcome",
      position: { x: centerX - outcomeSpacing, y: outcomeY },
      data: {
        label: "Total Replied",
        count: stats.emailsReplied,
        type: "replied",
        percentage: repliedPercentage,
        totalContacts: stats.totalContacts,
      },
      draggable: false,
    });

    // Opened node (but not replied)
    flowNodes.push({
      id: "outcome-opened",
      type: "outcome",
      position: { x: centerX, y: outcomeY },
      data: {
        label: "Opened Only",
        count: stats.emailsOpened,
        type: "opened",
        percentage: openedPercentage,
        totalContacts: stats.totalContacts,
      },
      draggable: false,
    });

    // No Reply node
    flowNodes.push({
      id: "outcome-no-reply",
      type: "outcome",
      position: { x: centerX + outcomeSpacing, y: outcomeY },
      data: {
        label: "No Reply",
        count: stats.noReply,
        type: "noReply",
        percentage: noReplyPercentage,
        totalContacts: stats.totalContacts,
      },
      draggable: false,
    });

    // Create edges connecting the stage nodes
    const flowEdges = stages.slice(0, -1).map((_, index) => ({
      id: `edge-${index}`,
      source: `stage-${stages[index].id}`,
      target: `stage-${stages[index + 1].id}`,
      animated: true,
      style: { stroke: "#000000", strokeWidth: 1 },
    }));

    // Add edges from last stage to outcome nodes
    if (stages.length > 0) {
      const lastStageId = `stage-${stages[stages.length - 1].id}`;
      
      flowEdges.push({
        id: "edge-to-replied",
        source: lastStageId,
        target: "outcome-replied",
        animated: true,
        style: { stroke: "#16a34a", strokeWidth: 2 },
        label: "Replied",
        labelStyle: { fontSize: 10, fontWeight: 500 },
      });

      flowEdges.push({
        id: "edge-to-opened",
        source: lastStageId,
        target: "outcome-opened",
        animated: true,
        style: { stroke: "#2563eb", strokeWidth: 2 },
        label: "Opened",
        labelStyle: { fontSize: 10, fontWeight: 500 },
      });

      flowEdges.push({
        id: "edge-to-no-reply",
        source: lastStageId,
        target: "outcome-no-reply",
        animated: true,
        style: { stroke: "#4b5563", strokeWidth: 2 },
        label: "No Reply",
        labelStyle: { fontSize: 10, fontWeight: 500 },
      });
    }

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [isLoading, data, selectedStage, stats]);

  const handleStageClick = useCallback((stage) => {
    setSelectedStage(stage);
    setShowEditor(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
  }, []);

  if (isLoading || contactsLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="border border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg font-medium">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow">
      <div className="grid grid-cols-1 h-full">
        <div className="relative h-[500px] border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.3}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            attributionPosition="bottom-right"
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <Panel
              position="top-left"
              className="bg-white p-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <h3 className="text-sm font-medium">Email Campaign Flow</h3>
              <p className="text-xs text-gray-600">
                Click on a stage to edit its template
              </p>
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                <p>Total Leads: <span className="font-medium text-black">{stats.totalContacts}</span></p>
              </div>
            </Panel>
          </ReactFlow>

          <AnimatePresence>
            {showEditor && selectedStage && (
              <motion.div
                className="absolute top-0 left-0 right-0 bottom-0 bg-white z-10 p-4 overflow-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">
                    Editing Stage {selectedStage.stage + 1}
                  </h3>
                  <button
                    onClick={handleCloseEditor}
                    className="px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Back to Flow
                  </button>
                </div>
                <UpdateTemplate
                  campaign={campaign}
                  stage={selectedStage}
                  message={selectedStage.message}
                  subject={selectedStage.subject}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Builder;
