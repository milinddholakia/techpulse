/**
 * TechPulse Visual Architecture & Flowchart Engine
 * Generates interactive, responsive SVG and node-based flowcharts
 * for all 50 AI curriculum topics and daily breaking news stories.
 */

(function (window) {
  'use strict';

  // Topic Diagram Database for all 50 AI Topics
  const TOPIC_DIAGRAMS = {
    // 1. Transformer Architecture
    'topic-1': {
      title: 'Scaled Dot-Product Self-Attention Pipeline',
      subtitle: 'Dynamic pairwise token relevance computation in O(N²) attention space',
      nodes: [
        { id: 'n1', label: 'Input Embeddings', tag: 'Stage 1: Input', type: 'input', desc: 'Raw token vectors X summed with positional encodings (Sinusoidal or RoPE).', metric: 'Shape: [Batch, SeqLen, d_model]' },
        { id: 'n2', label: 'Linear Projections', tag: 'Stage 2: Projections', type: 'process', desc: 'Embeddings projected into Query (Q), Key (K), and Value (V) subspaces via learned weights W_q, W_k, W_v.', metric: 'Q, K, V ∈ ℝ^{SeqLen × d_k}' },
        { id: 'n3', label: 'Scaled Dot-Product', tag: 'Stage 3: Affinity', type: 'operation', desc: 'Computes raw token similarity matrix Q · Kᵀ, divided by √d_k to prevent gradient vanishing in high dimensions.', metric: 'Scores = (Q · Kᵀ) / √d_k' },
        { id: 'n4', label: 'Softmax Distribution', tag: 'Stage 4: Normalization', type: 'activation', desc: 'Row-wise softmax transforms unbounded similarity scores into valid probability distributions (sum = 1.0).', metric: 'AttnWeights ∈ [0, 1]' },
        { id: 'n5', label: 'Weighted Value Sum', tag: 'Stage 5: Output', type: 'output', desc: 'Multiplies attention weights by Value matrix V to produce dynamically contextualized representations.', metric: 'Output = AttnWeights · V' }
      ]
    },
    'topic-2': {
      title: 'KV Caching (Key-Value Cache) Inference Pipeline',
      subtitle: 'Eliminating quadratic recomputation during autoregressive token generation',
      nodes: [
        { id: 'n1', label: 'Prompt Tokens 1..N-1', tag: 'Prefill Phase', type: 'input', desc: 'Full input prompt evaluated in parallel across all transformer layers.', metric: 'Initial Prefill Latency' },
        { id: 'n2', label: 'GPU VRAM Cache Pool', tag: 'Memory Store', type: 'process', desc: 'Keys (K) and Values (V) stored in high-speed GPU HBM buffers for each attention layer.', metric: 'VRAM: 2 × layers × heads × seq × d_k' },
        { id: 'n3', label: 'Single New Token N', tag: 'Decode Phase', type: 'operation', desc: 'Model computes Query (Q_N), Key (K_N), and Value (V_N) for only the newest single token.', metric: 'O(1) Compute per step' },
        { id: 'n4', label: 'Concatenation & Cross-Attn', tag: 'Attention', type: 'decision', desc: 'New K_N, V_N appended to cached tensors; Q_N attends over historical cached keys & values.', metric: 'Memory-Bound GEMV' },
        { id: 'n5', label: 'Token N+1 Output', tag: 'Output', type: 'output', desc: 'Generates logits for next token with steady millisecond step latency.', metric: 'Linear Time Complexity' }
      ]
    },
    'topic-3': {
      title: 'Reinforcement Learning from Human Feedback (RLHF)',
      subtitle: 'Tri-stage alignment pipeline from raw pretraining to human preference optimization',
      nodes: [
        { id: 'n1', label: 'Base Foundation LLM', tag: 'Stage 1: Pretraining', type: 'input', desc: 'Massive causal language model trained on trillions of web tokens to predict next token.', metric: 'Raw Next-Token Predictor' },
        { id: 'n2', label: 'Supervised Fine-Tuning (SFT)', tag: 'Stage 2: Instruction', type: 'process', desc: 'Model fine-tuned on curated high-quality (instruction, answer) demonstration pairs.', metric: 'Instruct-Following Baseline' },
        { id: 'n3', label: 'Reward Model (RM)', tag: 'Stage 3: Preference', type: 'operation', desc: 'Human labelers rank paired model outputs (y_w ≻ y_l); neural classifier learns scalar reward function r(x, y).', metric: 'Loss = -E[log σ(r_w - r_l)]' },
        { id: 'n4', label: 'PPO Policy Optimization', tag: 'Stage 4: RL Loop', type: 'decision', desc: 'Proximal Policy Optimization maximizes reward while KL-divergence penalty prevents drifting from SFT anchor.', metric: 'Reward + β · KL(π_θ || π_ref)' },
        { id: 'n5', label: 'Aligned Safe Model', tag: 'Stage 5: Output', type: 'output', desc: 'Helpful, honest, and harmless assistant ready for production deployment.', metric: 'Production Chatbot' }
      ]
    },
    'topic-4': {
      title: 'Direct Preference Optimization (DPO)',
      subtitle: 'Implicit reward optimization directly from paired preference data without RL training',
      nodes: [
        { id: 'n1', label: 'Preference Dataset', tag: 'Input Pairs', type: 'input', desc: 'Triple dataset (prompt x, winning response y_w, losing response y_l) collected from human or AI feedback.', metric: '𝒟 = {(x, y_w, y_l)}' },
        { id: 'n2', label: 'Reference Policy (π_ref)', tag: 'Frozen Anchor', type: 'process', desc: 'Frozen SFT model provides baseline probability distributions for regularization.', metric: 'Log-prob: log π_ref(y|x)' },
        { id: 'n3', label: 'Active Policy (π_θ)', tag: 'Trainable Model', type: 'operation', desc: 'Model being trained computes log-probability ratios for both winning and losing completions.', metric: 'Log-prob: log π_θ(y|x)' },
        { id: 'n4', label: 'Implicit Reward Loss', tag: 'DPO Objective', type: 'decision', desc: 'Calculates closed-form binary cross-entropy loss directly increasing likelihood of y_w over y_l.', metric: 'ℒ_DPO = -E[log σ(β log(π/π_ref))]' },
        { id: 'n5', label: 'Stable Aligned Weights', tag: 'Output', type: 'output', desc: 'Achieves RLHF quality with stable supervised training and zero reinforcement learning divergence.', metric: 'Single-Stage Optimization' }
      ]
    },
    'topic-5': {
      title: 'Mixture of Experts (MoE) Routing Pipeline',
      subtitle: 'Dynamic conditional computation: activating subset of parameters per token',
      nodes: [
        { id: 'n1', label: 'Token Hidden State (x)', tag: 'Input Vector', type: 'input', desc: 'Output vector from self-attention sublayer entering the Feed-Forward Network block.', metric: 'x ∈ ℝ^{d_model}' },
        { id: 'n2', label: 'Softmax Router / Gating', tag: 'Routing Logic', type: 'process', desc: 'Learned router matrix calculates affinity scores across all E available expert networks.', metric: 'Gate(x) = Softmax(TopK(x · W_g, k))' },
        { id: 'n3', label: 'Top-K Expert Dispatch', tag: 'Sparse Selection', type: 'operation', desc: 'Selects top-k experts (e.g. 2 out of 8, or 2 out of 64 in DeepSeek-V3), bypassing all inactive experts.', metric: 'Sparse Activation (k << E)' },
        { id: 'n4', label: 'Parallel Expert Compute', tag: 'Specialized FFNs', type: 'decision', desc: 'Selected expert networks independently execute their Feed-Forward matrix transformations.', metric: 'y_i = Expert_i(x)' },
        { id: 'n5', label: 'Weighted Sum Aggregation', tag: 'Output', type: 'output', desc: 'Outputs of active experts are weighted by gating coefficients and summed together.', metric: 'Output = ∑ G_i(x) · Expert_i(x)' }
      ]
    },
    'topic-6': {
      title: 'LLM Quantization Pipeline (FP32 → INT8 / INT4)',
      subtitle: 'Reducing precision to shrink memory footprint 4x with minimal perplexity degradation',
      nodes: [
        { id: 'n1', label: '32-Bit Weights (FP32)', tag: 'High Precision', type: 'input', desc: 'Standard training precision: 4 bytes per weight (70B model requires 280GB VRAM).', metric: '32 bits / parameter' },
        { id: 'n2', label: 'Dynamic Range Analysis', tag: 'Calibration', type: 'process', desc: 'Scans weights & activations to identify min, max, and salient outlier features (e.g. AWQ / SmoothQuant).', metric: 'Scale S = (W_max - W_min) / (2^b - 1)' },
        { id: 'n3', label: 'Mapping & Zero-Point Shift', tag: 'Quantization Map', type: 'operation', desc: 'Continuous floating point values mapped to discrete integer grid with clamping.', metric: 'q = round(W / S) + Z' },
        { id: 'n4', label: 'Integer Matrix Multiply', tag: 'Inference Kernel', type: 'decision', desc: 'Hardware tensor cores compute integer dot products at 2x-4x higher throughput and lower thermal TDP.', metric: 'INT4 Tensor Core GEMM' },
        { id: 'n5', label: 'Dequantized Output Tensor', tag: 'Output', type: 'output', desc: 'Activations scaled back to FP16/BF16 before next transformer layer. 70B runs on consumer GPUs.', metric: '70B Fits in 35-40GB VRAM' }
      ]
    },
    'topic-7': {
      title: 'Retrieval-Augmented Generation (RAG) System Architecture',
      subtitle: 'Grounded generation by dynamically fetching authoritative context chunks from vector stores',
      nodes: [
        { id: 'n1', label: 'User Query', tag: 'Input Request', type: 'input', desc: 'User asks a specific factual, enterprise, or codebase question.', metric: 'Natural Language Prompt' },
        { id: 'n2', label: 'Dense Vector Embedding', tag: 'Bi-Encoder', type: 'process', desc: 'Query transformed into a 1536-dimensional semantic representation vector.', metric: 'Embedding vector q ∈ ℝ^{d}' },
        { id: 'n3', label: 'HNSW Vector DB Search', tag: 'ANN Retrieval', type: 'operation', desc: 'Fast Approximate Nearest Neighbor search finds semantically close text chunks from knowledge store.', metric: 'Top-K Chunks (Cosine Sim)' },
        { id: 'n4', label: 'Cross-Encoder Re-Ranking', tag: 'Re-Ranker Filter', type: 'decision', desc: 'Cross-encoder scores (query, chunk) pairs to eliminate false-positive matches and prioritize best context.', metric: 'Top 3 High-Relevance Chunks' },
        { id: 'n5', label: 'Context-Augmented LLM Response', tag: 'Grounded Output', type: 'output', desc: 'LLM synthesizes response referencing retrieved facts with zero hallucination and source citations.', metric: 'Hallucination-Free Answer' }
      ]
    },
    'topic-8': {
      title: 'Vector Embeddings & Geometric Latent Space',
      subtitle: 'Mapping unstructured words, code, and images into high-dimensional semantic geometries',
      nodes: [
        { id: 'n1', label: 'Raw Token / Text Chunk', tag: 'Input', type: 'input', desc: 'Arbitrary text passage or code snippet requiring numerical representation.', metric: 'Unstructured Text' },
        { id: 'n2', label: 'Deep Encoder Transformer', tag: 'Encoder Pass', type: 'process', desc: 'Multi-layer bidirectional or causal transformer models semantic relationships across tokens.', metric: 'Hidden States H' },
        { id: 'n3', label: 'Mean / CLS Pooling', tag: 'Pooling Layer', type: 'operation', desc: 'Aggregates token-level hidden states into a single unified sentence embedding vector.', metric: 'v = Mean(H_{1..N})' },
        { id: 'n4', label: 'L2 Unit Normalization', tag: 'Normalization', type: 'decision', desc: 'Projects vector onto unit hypersphere (||v|| = 1) so dot product equals cosine similarity.', metric: 'v_norm = v / ||v||_2' },
        { id: 'n5', label: 'Semantic Latent Space', tag: 'Output', type: 'output', desc: 'Similar concepts cluster together; distances represent conceptual analogies (King - Man + Woman = Queen).', metric: 'Cosine Distance: 1 - (u·v)' }
      ]
    },
    'topic-9': {
      title: 'ReAct: Reasoning and Acting Agentic Loop',
      subtitle: 'Interleaving verbal reasoning traces with external tool actions for autonomous problem solving',
      nodes: [
        { id: 'n1', label: 'Task Objective', tag: 'User Goal', type: 'input', desc: 'Multi-step real-world objective (e.g. "Debug failing unit test and create pull request").', metric: 'Autonomous Task Prompt' },
        { id: 'n2', label: 'Thought (Reasoning)', tag: 'Step 1: Cognitive Trace', type: 'process', desc: 'Agent generates chain-of-thought hypothesis analyzing the current state and identifying next needed step.', metric: 'Thought: "I need to inspect auth.py"' },
        { id: 'n3', label: 'Action (Tool Execution)', tag: 'Step 2: External Action', type: 'operation', desc: 'Agent emits structured tool call (e.g. read_file, run_command, web_search, SQL query).', metric: 'Action: read_file("auth.py")' },
        { id: 'n4', label: 'Observation (Feedback)', tag: 'Step 3: Environment Response', type: 'decision', desc: 'Environment returns execution logs, stdout, error codes, or API responses back to context.', metric: 'Observation: "SyntaxError at L42"' },
        { id: 'n5', label: 'Reflection or Final Solution', tag: 'Step 4: Completion', type: 'output', desc: 'Agent iterates until goal criteria is met or outputs verified synthesized solution.', metric: 'Task Completed & Verified' }
      ]
    },
    'topic-10': {
      title: 'Test-Time Compute Scaling Architecture',
      subtitle: 'Trading additional inference FLOPs for higher reasoning accuracy via search and verification',
      nodes: [
        { id: 'n1', label: 'Complex Math / Logic Prompt', tag: 'Input Challenge', type: 'input', desc: 'Challenging theorem proving, competitive programming, or complex architecture question.', metric: 'Hard Benchmark Question' },
        { id: 'n2', label: 'Thinking Token Generation', tag: 'Extended Reasoning', type: 'process', desc: 'Model generates thousands of hidden "reasoning tokens" exploring multiple candidate paths and scratchpads.', metric: 'CoT Tokens (1k - 32k tokens)' },
        { id: 'n3', label: 'Branching Tree Search (MCTS)', tag: 'Search Space', type: 'operation', desc: 'Rolls out multiple reasoning candidate trajectories in parallel or sequence.', metric: 'Monte Carlo Tree Search' },
        { id: 'n4', label: 'Process Reward Verifier (PRM)', tag: 'Step-by-Step Scoring', type: 'decision', desc: 'Verifier model evaluates every single deduction step; prunes false assumptions early.', metric: 'PRM Step Score ∈ [0, 1]' },
        { id: 'n5', label: 'Provably Optimal Solution', tag: 'Final Output', type: 'output', desc: 'Backtracks from errors to produce self-corrected, logically sound solution.', metric: 'High Pass@1 Benchmark Score' }
      ]
    },
    'topic-15': {
      title: 'Diffusion Denoising Probabilistic Model (DDPM)',
      subtitle: 'Iterative Gaussian noise subtraction across reverse Markov chain timesteps',
      nodes: [
        { id: 'n1', label: 'Pure Gaussian Noise (z_T)', tag: 'Terminal Noise', type: 'input', desc: 'Unstructured standard normal noise tensor sampled at initial generation step.', metric: 'z_T ~ 𝒩(0, I)' },
        { id: 'n2', label: 'Text & Timestep Injection', tag: 'Conditioning', type: 'process', desc: 'Cross-attention incorporates text prompt embeddings and sinusoidal timestep scalar t.', metric: 'Conditioning Embeddings' },
        { id: 'n3', label: 'UNet / DiT Backbone', tag: 'Noise Prediction', type: 'operation', desc: 'Deep architecture predicts the specific noise vector ε_θ contaminating current state x_t.', metric: 'Predicted Noise: ε_θ(x_t, t, c)' },
        { id: 'n4', label: 'Reverse Step Equation', tag: 'Variance Preserving', type: 'decision', desc: 'Subtracts predicted noise and applies variance schedule to compute cleaner latent x_{t-1}.', metric: 'x_{t-1} = 1/√α_t · (x_t - ...)' },
        { id: 'n5', label: 'Coherent High-Res Sample (x_0)', tag: 'Final Output', type: 'output', desc: 'After 20-50 denoising iterations, sharp high-fidelity image or video tensor emerges.', metric: 'Photorealistic Generation' }
      ]
    },
    'topic-16': {
      title: 'Low-Rank Adaptation (LoRA) Architecture',
      subtitle: 'Freezing foundation weights while training low-rank factorized parameter matrices',
      nodes: [
        { id: 'n1', label: 'Input Activations (x)', tag: 'Input Vector', type: 'input', desc: 'Activation tensor entering linear transformer sublayer projection.', metric: 'x ∈ ℝ^{d_in}' },
        { id: 'n2', label: 'Frozen Base Model (W_0)', tag: 'Zero Gradients', type: 'process', desc: 'Original pre-trained parameters remain 100% frozen, requiring zero optimizer state VRAM.', metric: 'W_0 ∈ ℝ^{d_out × d_in} (Frozen)' },
        { id: 'n3', label: 'Down-Projection Matrix A', tag: 'Low-Rank Matrix', type: 'operation', desc: 'Gaussian initialized matrix compresses input dimension down to rank r (e.g. r=8 or 16).', metric: 'A ∈ ℝ^{r × d_in}' },
        { id: 'n4', label: 'Up-Projection Matrix B', tag: 'Zero-Init Matrix', type: 'operation', desc: 'Zero initialized matrix projects rank r back to full output dimension d_out.', metric: 'B ∈ ℝ^{d_out × r}' },
        { id: 'n5', label: 'Combined Output (Y)', tag: 'Synthesized Output', type: 'output', desc: 'Y = W_0·x + (α/r)·B·A·x. Adapters train in minutes and can be hot-swapped instantly.', metric: '< 1% Trainable Parameters' }
      ]
    },
    'topic-20': {
      title: 'Vision Transformer (ViT) Image Processing Flow',
      subtitle: 'Treating 16x16 image patches as sequence tokens for standard transformer encoder',
      nodes: [
        { id: 'n1', label: 'Input RGB Image', tag: 'Raw Image', type: 'input', desc: 'Standard 2D image matrix (e.g. 224 × 224 × 3).', metric: 'Image: H × W × C' },
        { id: 'n2', label: '16x16 Patch Extraction', tag: 'Patch Division', type: 'process', desc: 'Image decomposed into N non-overlapping 16×16 spatial patches.', metric: 'N = (H · W) / P² = 196 patches' },
        { id: 'n3', label: 'Linear Projection + [CLS]', tag: 'Embedding & Class Token', type: 'operation', desc: 'Patches flattened and linearly projected to embedding dimension; prepend learnable [CLS] token and 1D positional encodings.', metric: 'Patch Embeddings ∈ ℝ^{197 × d}' },
        { id: 'n4', label: 'Standard Transformer Blocks', tag: 'Self-Attention Layers', type: 'decision', desc: 'L blocks of multi-head self-attention and MLP layers process global patch interactions.', metric: 'Full Global Receptive Field' },
        { id: 'n5', label: 'MLP Classification Head', tag: 'Prediction', type: 'output', desc: 'Extracts final [CLS] state and maps through MLP head to predict class probabilities.', metric: 'Top-1 Class Probabilities' }
      ]
    },
    'topic-11': {
      title: 'Rotary Position Embeddings (RoPE) Mathematical Flow',
      subtitle: 'Encoding relative position into attention via 2D rotation of Query and Key vectors',
      nodes: [
        { id: 'n1', label: 'Token Feature Pair (x_1, x_2)', tag: '2D Chunk', type: 'input', desc: 'Embedding dimensions paired into consecutive 2D orthogonal coordinate pairs.', metric: 'x ∈ ℝ^2' },
        { id: 'n2', label: 'Position Frequency Matrix (R_m)', tag: 'Rotation Angle', type: 'process', desc: 'Calculates position-dependent angle θ_i = 10000^{-2(i-1)/d} scaled by token index m.', metric: 'Angle: m · θ_i' },
        { id: 'n3', label: 'Orthogonal Rotation Matrix', tag: 'Rotary Operator', type: 'operation', desc: 'Multiplies vectors by 2D rotation matrix: [cos(mθ) -sin(mθ); sin(mθ) cos(mθ)].', metric: 'Norm-Preserving Rotation' },
        { id: 'n4', label: 'Inner Product Invariant', tag: 'Relative Decay', type: 'decision', desc: 'Inner product ⟨R_m Q, R_n K⟩ simplifies to function of relative distance (m - n).', metric: 'Self-Decaying Distance' },
        { id: 'n5', label: 'Position-Aware Attention', tag: 'Output', type: 'output', desc: 'Allows smooth length extrapolation across 128k+ token contexts with zero extra parameters.', metric: 'Extended Context Window' }
      ]
    },
    'topic-12': {
      title: 'Group Relative Policy Optimization (GRPO)',
      subtitle: 'DeepSeek-R1 reinforcement learning algorithm eliminating the critic model',
      nodes: [
        { id: 'n1', label: 'Prompt (q)', tag: 'Input Prompt', type: 'input', desc: 'Challenging math, reasoning, or code synthesis prompt fed to policy.', metric: 'Query Prompt' },
        { id: 'n2', label: 'Group Rollout Sampling', tag: 'Group Generation', type: 'process', desc: 'Policy samples G distinct candidate reasoning paths {o_1, o_2, ..., o_G} in parallel.', metric: 'G = 8 to 64 outputs' },
        { id: 'n3', label: 'Rule-Based Outcome Scoring', tag: 'Reward Evaluation', type: 'operation', desc: 'Compiler checks code correctness and format tags (<think>...</think>) yielding reward r_i.', metric: 'Scalar Rewards {r_1..r_G}' },
        { id: 'n4', label: 'Group Relative Advantage', tag: 'Normalization', type: 'decision', desc: 'Calculates advantage by normalizing rewards against the group mean and standard deviation: A_i = (r_i - μ) / σ.', metric: 'Zero-Critic Baseline' },
        { id: 'n5', label: 'Policy Gradient Update', tag: 'Output', type: 'output', desc: 'PPO-style clipped policy update drives emergent self-reflection and chain-of-thought.', metric: 'Emergent Reasoning Policy' }
      ]
    },
    'topic-13': {
      title: 'FlashAttention: IO-Aware Exact Attention',
      subtitle: 'Tiling and kernel fusion to minimize slow GPU HBM memory roundtrips',
      nodes: [
        { id: 'n1', label: 'Standard Attention Matrix', tag: 'Memory Bottleneck', type: 'input', desc: 'Standard attention writes huge N × N intermediate matrices to slow High-Bandwidth Memory (HBM).', metric: 'O(N²) HBM IO Bottleneck' },
        { id: 'n2', label: 'Block Tiling Division', tag: 'SRAM Cache Division', type: 'process', desc: 'Partitions Q, K, V matrices into compact sub-blocks that fit into blazing-fast GPU SRAM (192KB per SM).', metric: 'Block Size B_r × B_c' },
        { id: 'n3', label: 'Online Softmax Rescaling', tag: 'Streaming Softmax', type: 'operation', desc: 'Computes softmax incrementally per block without materializing the full N × N attention matrix.', metric: 'Running Max & Sum Exponentials' },
        { id: 'n4', label: 'Kernel Fusion Pipeline', tag: 'Fused CUDA Kernel', type: 'decision', desc: 'Dot product, scaling, softmax, and value multiplication computed in a single GPU kernel pass.', metric: 'Zero Intermediate HBM Writes' },
        { id: 'n5', label: '3x Speedup & 10x Memory Reduction', tag: 'Output', type: 'output', desc: 'Identical mathematical precision with dramatic speedup, enabling 1M+ token context lengths.', metric: 'Linear Memory Scaling' }
      ]
    },
    'topic-17': {
      title: 'Function Calling & Structured Outputs',
      subtitle: 'Constraining LLM logits with context-free grammars for schema-guaranteed JSON',
      nodes: [
        { id: 'n1', label: 'Tool Declaration (JSON Schema)', tag: 'Schema Specification', type: 'input', desc: 'OpenAPI or JSON Schema defining function parameters, types, enums, and required fields.', metric: 'Target JSON Schema' },
        { id: 'n2', label: 'Grammar Parser (CFG / Regex)', tag: 'State Machine', type: 'process', desc: 'Schema compiled into a Deterministic Finite Automaton (DFA) tracking valid syntax at every character.', metric: 'Finite State Automaton' },
        { id: 'n3', label: 'Logit Masking at Decode Step', tag: 'Constrained Sampling', type: 'operation', desc: 'Sets logit = -∞ for all vocabulary tokens that would violate the schema syntax state.', metric: 'Invalid Tokens Masked' },
        { id: 'n4', label: 'Guaranteed Valid Tool Call', tag: 'Deterministic Parsing', type: 'decision', desc: 'Model generates syntactically flawless JSON arguments with 0% parsing failure rate.', metric: '100% Schema Conformance' },
        { id: 'n5', label: 'Automated Backend Execution', tag: 'Tool Action', type: 'output', desc: 'Application safely executes API, database query, or code and returns observation to LLM.', metric: 'Zero-Error Tool Execution' }
      ]
    },
    'topic-18': {
      title: 'Dual-LLM Prompt Injection Defense Architecture',
      subtitle: 'Segregating untrusted external data from instruction execution via privileged orchestrator',
      nodes: [
        { id: 'n1', label: 'Untrusted User / Web Content', tag: 'Adversarial Input', type: 'input', desc: 'External web page or user prompt containing adversarial "Ignore previous instructions" injections.', metric: 'Untrusted Data Stream' },
        { id: 'n2', label: 'Quarantine Data Boundary', tag: 'Sandbox Isolation', type: 'process', desc: 'Untrusted text is wrapped in cryptographic delimiter tags (<untrusted_data>) with zero executive privilege.', metric: 'Delimited Payload' },
        { id: 'n3', label: 'Guardrail Classifier LLM', tag: 'Fast Filter', type: 'operation', desc: 'Lightweight classifier checks semantic embeddings for instruction hijacking or jailbreak signatures.', metric: 'Adversarial Threat Score' },
        { id: 'n4', label: 'Privileged Executive LLM', tag: 'Isolated Orchestrator', type: 'decision', desc: 'Main agent only reads extracted factual entities from data; never executes commands inside data.', metric: 'Privilege Separation' },
        { id: 'n5', label: 'Safe Execution Output', tag: 'Verified Response', type: 'output', desc: 'Executes verified user instructions safely while neutralizing embedded injection attacks.', metric: 'Adversarially Resilient' }
      ]
    },
    'topic-19': {
      title: 'Speculative Decoding Inference Accelerator',
      subtitle: 'Small draft model generates candidate tokens; large model verifies in single forward pass',
      nodes: [
        { id: 'n1', label: 'Prompt / Current Context', tag: 'Starting State', type: 'input', desc: 'Current token sequence requiring continuation.', metric: 'Context History' },
        { id: 'n2', label: 'Lightweight Draft Model (e.g. 1B)', tag: 'Speculative Generation', type: 'process', desc: 'Tiny, ultra-fast model quickly speculates K candidate tokens (e.g. 4-6 tokens) in milliseconds.', metric: 'K Draft Tokens (High FPS)' },
        { id: 'n3', label: 'Target Foundation Model (e.g. 70B)', tag: 'Parallel Verification', type: 'operation', desc: 'Large 70B model evaluates all K draft tokens simultaneously in a single forward pass.', metric: 'Single Target Forward Pass' },
        { id: 'n4', label: 'Rejection Sampling Acceptance Filter', tag: 'Verification Gate', type: 'decision', desc: 'Accepts tokens matching target distribution with p = min(1, P_target / P_draft); recovers exact target distribution.', metric: 'Mathematical Equivalence' },
        { id: 'n5', label: '2x-3x End-to-End Speedup', tag: 'Output Stream', type: 'output', desc: 'Emits multiple tokens per step without changing target model output or quality.', metric: 'Zero Quality Loss Speedup' }
      ]
    },
    'topic-26': {
      title: 'PagedAttention & vLLM Memory Management',
      subtitle: 'Virtual memory paging for GPU KV caches eliminating internal & external fragmentation',
      nodes: [
        { id: 'n1', label: 'Dynamic Request Stream', tag: 'Variable Contexts', type: 'input', desc: 'Concurrent user requests of unpredictable and variable sequence lengths.', metric: 'High-Concurrency Influx' },
        { id: 'n2', label: 'Virtual Block Table Allocation', tag: 'OS-Style Paging', type: 'process', desc: 'Divides GPU KV cache memory into non-contiguous fixed-size blocks (e.g. 16 tokens per block).', metric: 'Block Table Mapping' },
        { id: 'n3', label: 'On-Demand Page Fetching', tag: 'Dynamic Growth', type: 'operation', desc: 'Allocates new 16-token physical pages only when current block fills up; eliminates pre-allocation waste.', metric: '< 4% Memory Waste (vs 60%)' },
        { id: 'n4', label: 'Copy-on-Write Prefix Sharing', tag: 'Parallel Branching', type: 'decision', desc: 'Multiple parallel generations sharing a common prompt reference the same physical memory blocks.', metric: 'Zero Memory Duplication' },
        { id: 'n5', label: '4x Higher Serving Throughput', tag: 'Production Server', type: 'output', desc: 'Batches 4x-8x more concurrent users per GPU without running Out-Of-Memory (OOM).', metric: 'Near-Zero Waste VRAM' }
      ]
    },
    'topic-40': {
      title: 'Monte Carlo Tree Search (MCTS) for LLM Reasoning',
      subtitle: 'Four-phase tree exploration algorithm discovering deep mathematical deductions',
      nodes: [
        { id: 'n1', label: 'Selection Phase (PUCT)', tag: 'Phase 1: Navigate Tree', type: 'input', desc: 'Traverses current reasoning search tree selecting nodes with highest Upper Confidence Bound (exploration vs exploitation).', metric: 'PUCT Score Optimization' },
        { id: 'n2', label: 'Expansion Phase', tag: 'Phase 2: Generate Branches', type: 'process', desc: 'LLM generates multiple distinct next deduction steps from selected node.', metric: 'Branching Factor b = 3..5' },
        { id: 'n3', label: 'Simulation / Rollout Phase', tag: 'Phase 3: Deep Trajectory', type: 'operation', desc: 'Fast model completes solution from new node down to terminal state.', metric: 'Terminal Solution Candidate' },
        { id: 'n4', label: 'Backpropagation & Evaluation', tag: 'Phase 4: Value Update', type: 'decision', desc: 'Process Reward Model scores outcome; updates visit counts N(s, a) and value estimates Q(s, a) up the tree.', metric: 'Q-Value Backpropagation' },
        { id: 'n5', label: 'Robust Verified Solution', tag: 'Final Output', type: 'output', desc: 'Selects path with highest visit count, discovering non-intuitive proofs and complex bug fixes.', metric: 'World-Class Math & Code' }
      ]
    },
  };

  // Generic fallback diagram generator for any of the 50 topics
  function generateFallbackTopicDiagram(topic) {
    const title = topic.title || 'AI Concept Architecture';
    const cat = topic.category || 'Core AI';
    
    return {
      title: `${title} Architecture Pipeline`,
      subtitle: `Systematic representation of data flow and operational transformations for ${title}`,
      nodes: [
        {
          id: 'step-1',
          label: 'Input & Initialization',
          tag: 'Phase 1: Ingestion',
          type: 'input',
          desc: `Initial input representations or system configuration prepared for ${title}.`,
          metric: 'Normalized Input Tensor'
        },
        {
          id: 'step-2',
          label: 'Feature Transformation & Representation',
          tag: 'Phase 2: Representation',
          type: 'process',
          desc: `High-dimensional mapping and feature extraction specific to ${cat}.`,
          metric: 'Latent Space Projection'
        },
        {
          id: 'step-3',
          label: 'Core Algorithm / Routing Mechanism',
          tag: 'Phase 3: Core Engine',
          type: 'operation',
          desc: topic.technicalBreakdown 
            ? topic.technicalBreakdown.slice(0, 140) + '...'
            : `Algorithmic execution stage computing state updates.`,
          metric: 'Core Optimization Step'
        },
        {
          id: 'step-4',
          label: 'Verification & Normalization',
          tag: 'Phase 4: Optimization',
          type: 'decision',
          desc: `Constraint verification, regularized scaling, or probability distribution calibration.`,
          metric: 'Loss & Residual Alignment'
        },
        {
          id: 'step-5',
          label: 'Synthesized Production Output',
          tag: 'Phase 5: Output',
          type: 'output',
          desc: topic.keyTakeaway || `Final calibrated model parameters, token predictions, or inference output.`,
          metric: 'Production Ready State'
        }
      ]
    };
  }

  // Generates specific news flowcharts based on article categories
  function getNewsDiagram(article) {
    const cat = article.category || 'Tech & AI';
    const title = article.title || 'Breaking Tech Briefing';

    if (cat.includes('Reasoning') || cat.includes('LLM')) {
      return {
        title: 'Frontier LLM Reasoning & Verification Pipeline',
        subtitle: `Architectural dataflow behind ${article.source}'s report: "${title.slice(0, 55)}..."`,
        nodes: [
          { id: 's1', label: 'User Problem & System Instructions', tag: 'Input', type: 'input', desc: 'Complex reasoning, logic, coding, or mathematical prompt.', metric: 'Input Tokens' },
          { id: 's2', label: 'Extended Chain-of-Thought Generator', tag: 'Scratchpad Generation', type: 'process', desc: 'Autoregressive transformer computes hidden thinking steps and explores alternative solution hypotheses.', metric: 'Thinking Tokens' },
          { id: 's3', label: 'Process Reward Verifier (PRM)', tag: 'Stepwise Verification', type: 'operation', desc: 'Evaluates correctness of intermediate reasoning steps to detect logic flaws early.', metric: 'PRM Step Confidence' },
          { id: 's4', label: 'Branch Pruning & Rollout Selection', tag: 'Search Tree Filtering', type: 'decision', desc: 'Backtracks from disproven paths and selects the highest scoring mathematical reasoning trajectory.', metric: 'Best-of-N Candidate' },
          { id: 's5', label: 'Calibrated Production Response', tag: 'Synthesized Output', type: 'output', desc: 'Clean, verified solution with complete logical explanation delivered with high benchmark confidence.', metric: 'Verified Output' }
        ]
      };
    }

    if (cat.includes('Hardware') || cat.includes('Chip')) {
      return {
        title: 'Advanced AI Silicon & Memory Compute Flow',
        subtitle: `Hardware acceleration architecture featured in ${article.source}'s report`,
        nodes: [
          { id: 's1', label: 'Host System CPU / Orchestration', tag: 'Host Interface', type: 'input', desc: 'Kernel launches and dispatch schedules via PCIe Gen5 / CXL interconnect.', metric: 'Host Kernel Dispatch' },
          { id: 's2', label: 'HBM3e High-Bandwidth Memory (8 TB/s)', tag: 'Ultra-Fast Memory', type: 'process', desc: 'Stacked 3D DRAM memory stacks feed billions of weights to compute dies with massive bandwidth.', metric: '8 TB/sec Bandwidth' },
          { id: 's3', label: 'Streaming Multiprocessors & Tensor Cores', tag: 'Matrix Engine (GEMM)', type: 'operation', desc: 'FP8 / FP4 precision tensor processing cores execute billions of dot products concurrently.', metric: 'PFLOPS Dense Compute' },
          { id: 's4', label: 'NVLink 5.0 Inter-Chip Mesh Network', tag: 'Scale-Out Fabric', type: 'decision', desc: 'Bidirectional inter-GPU interconnect enables cluster-wide all-reduce communication without CPU bottleneck.', metric: '1.8 TB/s per GPU' },
          { id: 's5', label: 'Sub-Millisecond Inference Execution', tag: 'High-Throughput Yield', type: 'output', desc: 'Low-latency token generation serving thousands of enterprise concurrent queries.', metric: 'Maximum FLOPS/Watt' }
        ]
      };
    }

    if (cat.includes('Robotics') || cat.includes('Physical AI')) {
      return {
        title: 'Vision-Language-Action (VLA) Embodied AI Loop',
        subtitle: `Sensory-motor perception and continuous physical policy control`,
        nodes: [
          { id: 's1', label: 'Multimodal Sensor Array (RGB-D + IMU)', tag: 'Sensory Input', type: 'input', desc: 'Head-mounted cameras, depth sensors, and joint torque encoders capture real-time physical scene.', metric: '60 FPS Sensor Stream' },
          { id: 's2', label: 'Spatial-Temporal Tokenizer', tag: 'Perception Encoder', type: 'process', desc: 'Encodes spatial 3D scene geometry and natural language user instruction into unified tokens.', metric: 'Scene Latent Embeddings' },
          { id: 's3', label: 'VLA Foundation Policy Model', tag: 'Cognitive Engine', type: 'operation', desc: 'Large transformer reasons about affordances, obstacle avoidance, and sequential motor goals.', metric: 'Action Token Generator' },
          { id: 's4', label: 'Diffusion Motor Trajectory Generator', tag: 'Continuous Control', type: 'decision', desc: 'Diffusion policy samples smooth 7-DoF arm trajectories and gripper force vectors.', metric: 'Action Chunks (100 Hz)' },
          { id: 's5', label: 'Direct Actuator Joint Control', tag: 'Physical Execution', type: 'output', desc: 'Brushless motor controllers execute torque commands for precise object manipulation.', metric: 'Millimeter Accuracy' }
        ]
      };
    }

    if (cat.includes('Autonomous') || cat.includes('Mobility')) {
      return {
        title: 'Autonomous Vehicle Level-4 Perception & Planning Stack',
        subtitle: `Real-time sensor fusion, occupancy prediction, and drive-by-wire actuation`,
        nodes: [
          { id: 's1', label: 'Multi-Sensor Ingestion (LiDAR + Radar + Cameras)', tag: 'Raw 360° Sensors', type: 'input', desc: 'Full-spectrum surround sensors streaming gigabytes of raw physical data per second.', metric: 'Multi-Sensor Fusion' },
          { id: 's2', label: '3D Voxel Temporal Occupancy Grid', tag: 'World Model', type: 'process', desc: 'Predicts dynamic 3D occupancy and velocity vectors for all pedestrians, vehicles, and obstacles.', metric: '4D Spatial-Temporal Grid' },
          { id: 's3', label: 'Intent & Trajectory Forecasting', tag: 'Predictive Neural Net', type: 'operation', desc: 'Simulates probable future paths of surrounding agents over 5-10 second horizons.', metric: 'Probabilistic Trajectories' },
          { id: 's4', label: 'Model Predictive Path Planning (MPC)', tag: 'Motion Optimizer', type: 'decision', desc: 'Computes jerk-free, fuel-efficient collision-free trajectory with strict safety constraints.', metric: '50ms Plan Recalculation' },
          { id: 's5', label: 'Drive-by-Wire Steering & Braking Control', tag: 'Vehicle Dynamics', type: 'output', desc: 'Direct electronic signal actuation ensuring smooth passenger comfort and SAE Level 4 safety.', metric: 'Zero-Disengagement Control' }
        ]
      };
    }

    // Default Tech & AI Architecture Flow
    return {
      title: 'End-to-End System Architecture & Dataflow',
      subtitle: `Engineering pipeline and component interactions for this briefing`,
      nodes: [
        { id: 's1', label: 'System Trigger / Request Ingestion', tag: 'Entry Point', type: 'input', desc: 'Data ingestion, API request, or user interaction initiating system execution.', metric: 'Input Trigger' },
        { id: 's2', label: 'Processing & Semantic Normalization', tag: 'Transformation', type: 'process', desc: 'Raw inputs structured, tokenized, or normalized into high-dimensional representations.', metric: 'Data Pipeline' },
        { id: 's3', label: 'Core Neural / Algorithmic Engine', tag: 'Core Computation', type: 'operation', desc: article.technicalDeepDive ? article.technicalDeepDive.slice(0, 130) + '...' : 'Underlying architectural compute layer processing core representations.', metric: 'Target Operations' },
        { id: 's4', label: 'Quality Verification & Performance Clamp', tag: 'Verification Gate', type: 'decision', desc: 'Ensures system reliability, security boundaries, and benchmark conformance.', metric: 'Validation Layer' },
        { id: 's5', label: 'Production Output & Downstream Impact', tag: 'Target Metric', type: 'output', desc: article.industryImpact ? article.industryImpact.slice(0, 130) + '...' : 'High-impact deliverables deployed to end users and developers.', metric: 'Production State' }
      ]
    };
  }

  // Renders the responsive Flowchart HTML widget
  function renderFlowchartHTML(diagram, options = {}) {
    if (!diagram || !diagram.nodes) return '';

    const nodes = diagram.nodes;
    const isCompact = !!options.compact;

    const nodesHtml = nodes.map((node, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === nodes.length - 1;
      const stepNumber = idx + 1;

      // Connector arrow (unless last node)
      const connectorHtml = !isLast ? `
        <div class="flow-connector" aria-hidden="true">
          <div class="flow-line">
            <span class="flow-pulse-dot"></span>
          </div>
          <span class="flow-arrow-head">▶</span>
        </div>
      ` : '';

      return `
        <div class="flow-node flow-type-${node.type || 'process'}" data-node-idx="${idx}" tabindex="0">
          <div class="flow-node-badge-row">
            <span class="flow-step-pill">Step ${stepNumber}</span>
            <span class="flow-tag">${node.tag || 'Stage'}</span>
          </div>
          <h4 class="flow-node-title">${node.label}</h4>
          <p class="flow-node-desc">${node.desc}</p>
          ${node.metric ? `
            <div class="flow-metric-badge">
              <span class="metric-icon">⚡️</span>
              <span class="metric-text">${node.metric}</span>
            </div>
          ` : ''}
        </div>
        ${connectorHtml}
      `;
    }).join('');

    return `
      <section class="flowchart-container ${isCompact ? 'compact' : ''}">
        <div class="flowchart-header">
          <div class="flowchart-title-group">
            <span class="flowchart-header-icon">📊</span>
            <div>
              <h3 class="flowchart-title">${diagram.title}</h3>
              <p class="flowchart-subtitle">${diagram.subtitle || 'System Architecture Flowchart'}</p>
            </div>
          </div>
          <span class="flowchart-badge">${nodes.length} Stages</span>
        </div>

        <div class="flowchart-track-wrapper">
          <div class="flowchart-track">
            ${nodesHtml}
          </div>
        </div>

        <div class="flowchart-footer-hint">
          <span>💡 Tap or hover any stage above to inspect data transformations & metrics</span>
        </div>
      </section>
    `;
  }

  // Public Interface
  window.TechPulseDiagrams = {
    getTopicDiagram: function (topicId, topicData) {
      if (TOPIC_DIAGRAMS[topicId]) {
        return TOPIC_DIAGRAMS[topicId];
      }
      return generateFallbackTopicDiagram(topicData || { id: topicId });
    },
    getNewsDiagram: function (article) {
      return getNewsDiagram(article);
    },
    renderFlowchartHTML: function (diagram, options) {
      return renderFlowchartHTML(diagram, options);
    }
  };

})(window);
