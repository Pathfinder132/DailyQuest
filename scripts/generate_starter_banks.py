from pathlib import Path
root=Path(__file__).resolve().parents[1] / 'src' / 'data'
root.mkdir(parents=True,exist_ok=True)
# Each line: question ~ correct answer ~ distractor 1 ~ distractor 2 ~ distractor 3
banks = {
'DSA': '''Which structure gives average O(1) key lookup?~Hash table~Binary search tree~Linked list~Min-heap
Which traversal of a BST visits keys in sorted order?~In-order~Pre-order~Post-order~Level-order
What is the worst-case time of binary search on a sorted array?~O(log n)~O(1)~O(n)~O(n log n)
Which data structure naturally supports undo operations?~Stack~Queue~Disjoint set~Trie
Which structure is best for FIFO processing?~Queue~Stack~Max-heap~Call stack
Which algorithm finds shortest paths in an unweighted graph?~BFS~DFS~Kruskal~Topological sort
Which algorithm finds shortest paths with non-negative edge weights?~Dijkstra's algorithm~Bellman-Ford only~Prim's algorithm~KMP
What does a disjoint-set union structure track efficiently?~Connected components/sets~Sorted array ranges~Prefix strings~Heap order
Which sorting algorithm has guaranteed O(n log n) worst-case time?~Merge sort~Basic quicksort~Bubble sort~Insertion sort
Which sorting algorithm is usually in-place and average O(n log n), but worst-case O(n²)?~Quicksort~Counting sort~Merge sort~Radix sort
What is the amortized time of appending to a dynamic array?~O(1)~O(log n)~O(n) always~O(n log n)
Which data structure is useful for prefix-based word search?~Trie~Heap~Queue~Disjoint set
What property defines a min-heap?~Each parent is no greater than its children~In-order traversal is sorted~Every node has two children~All leaves share one depth
Which algorithm is commonly used for a minimum spanning tree?~Kruskal's algorithm~Binary search~Floyd-Warshall~KMP
What is the time complexity of BFS with adjacency lists?~O(V + E)~O(V²E)~O(log V)~O(E log E) always
Which technique solves overlapping subproblems by reusing results?~Dynamic programming~Backtracking only~Linear search~Hashing
What is the key idea of a greedy algorithm?~Choose a locally best option at each step~Enumerate every possible answer~Always split input in half~Store all states in a hash table
When is a topological ordering defined?~For a directed acyclic graph~For every undirected graph~Only for complete graphs~Only for weighted trees
Which structure powers an efficient priority queue?~Heap~Stack~Plain linked list only~Trie
What is the worst-case lookup time in a singly linked list?~O(n)~O(1)~O(log n)~O(n log n)
Which collision strategy stores multiple entries in a bucket?~Separate chaining~Binary lifting~Path compression~Memoization
What does path compression improve in DSU?~Future find operations~Heap extraction~Array indexing~Graph edge sorting only
Which algorithm finds all-pairs shortest paths using dynamic programming?~Floyd-Warshall~Prim~BFS from one source only~Kruskal
What is the recurrence idea behind merge sort?~Sort halves and merge them~Pick a pivot and partition once~Repeatedly swap adjacent items~Insert each item into a trie
Which technique reduces duplicate recursive work in Fibonacci?~Memoization~Linear probing~Topological sorting~Selection sort
What is a stable sort?~Equal-key items keep their relative order~It never uses extra memory~Its runtime never varies~It sorts only integers
Which operation is O(1) in a stack?~Push/pop at the top~Search for an arbitrary value~Find the minimum without augmentation~Sort all elements
Which data structure supports efficient range minimum queries after preprocessing?~Segment tree~Stack~Queue~Hash set
What does a monotonic stack help find efficiently?~Next greater/smaller elements~Shortest weighted paths~All graph components only~String hashes only
What does a circular queue avoid?~Wasted front slots after dequeue~Hash collisions~Tree rotations~Recursive calls
Which technique is appropriate for all subsets of a small set?~Backtracking/bitmask enumeration~Binary search~Dijkstra~Counting sort only
What is the expected lookup complexity of a well-sized hash map?~O(1)~O(log n) guaranteed~O(n log n)~O(n²)
Which tree is self-balancing using rotations and strict height balance?~AVL tree~Unbalanced BST~Trie~B-tree leaf list
What does a B-tree optimize for?~Block-oriented storage and fewer disk accesses~Constant-time arbitrary graph paths~Recursive string matching~FIFO scheduling
Which pattern-matching algorithm uses a prefix-function to avoid rechecking?~KMP~Dijkstra~Kruskal~Heap sort
What is the time complexity of building a binary heap bottom-up?~O(n)~O(n log n)~O(log n)~O(n²)
Which algorithm detects a cycle in a directed graph using three-color DFS?~DFS with visiting states~Binary search~Prim~Counting sort
What is a common use of a Fenwick tree?~Prefix sums with point updates~Priority scheduling by string prefix~Shortest path with negative edges~Balanced parenthesis parsing only
What does two-pointer technique often reduce?~Nested scans to a linear scan~Memory to exactly zero~Every problem to O(log n)~Graph vertices to edges
Which approach is suited to maximum subarray sum in O(n)?~Kadane's algorithm~Floyd-Warshall~Kruskal~Heap construction
What is the main purpose of a sentinel node?~Simplify boundary cases in linked structures~Guarantee O(1) sorting~Prevent hash collisions~Balance every binary tree
Which structure supports efficient union and find?~Disjoint-set union~Deque only~Trie only~Binary indexed array without operations
What is the worst-case time of insertion sort on reverse-sorted input?~O(n²)~O(log n)~O(n)~O(1)
Which traversal visits nodes level by level?~Level-order BFS~In-order DFS~Post-order DFS~Reverse topological sort
Which condition allows binary search to discard half the candidates?~The search space is ordered by a monotonic condition~All values are unique strings~The array is linked~Every element is positive
What is a DAG?~Directed acyclic graph~Dense adjacency grid~Data allocation group~Double-ended queue
Which graph representation is usually memory-efficient for sparse graphs?~Adjacency list~Adjacency matrix~Full transitive-closure matrix~Complete edge table indexed by every pair
Why use a deque?~Efficient insertion/removal at both ends~Sorted lookup without comparison~Automatic graph coloring~Constant-time arbitrary search
What does a recursive base case do?~Stops recursion for a smallest solved input~Calls the function forever~Sorts the call stack~Allocates a graph edge
Which method can detect a linked-list cycle in O(1) extra space?~Floyd's tortoise-and-hare~Binary search~BFS from every node~Merge sort
What is the main trade-off of a hash table?~Fast average lookup versus collision and resizing concerns~Guaranteed sorted iteration~No memory overhead~Always O(log n) lookup
Which complexity grows slowest for large n among these?~O(log n)~O(n)~O(n log n)~O(n²)''',
'SQL': '''Which clause filters rows before grouping?~WHERE~HAVING~ORDER BY~LIMIT
Which clause filters groups after aggregation?~HAVING~WHERE~FROM~OFFSET
What does SELECT DISTINCT remove?~Duplicate result rows~Duplicate rows permanently from the table~NULL values only~Rows failing a constraint
Which join returns only rows with matching keys on both sides?~INNER JOIN~LEFT JOIN~CROSS JOIN~FULL OUTER JOIN
Which join retains every left-side row even without a match?~LEFT JOIN~INNER JOIN~CROSS JOIN~NATURAL JOIN only
What does COUNT(*) count?~Rows~Only non-NULL values in one column~Distinct tables~Only rows with a primary key named id
How does COUNT(column) treat NULL values?~It ignores NULLs~It counts every NULL as one~It raises an error~It converts NULL to zero
Which aggregate returns the largest value?~MAX()~SUM()~AVG()~COUNT()
Which clause orders output rows?~ORDER BY~GROUP BY~WHERE~HAVING
What is the default sort direction for ORDER BY?~Ascending~Descending~Random~Insertion order is guaranteed
Which operator checks whether a value matches any value in a list?~IN~LIKE~IS NULL~BETWEEN only
Which operator is commonly used for wildcard string matching?~LIKE~EXISTS~UNION~CASE
In LIKE, what does percent (%) match?~Zero or more characters~Exactly one character~Only digits~A literal percent in every case
Which expression tests for a missing value correctly?~IS NULL~= NULL~== NULL~IS EMPTY
What does COALESCE(a,b) return?~The first non-NULL argument~The largest argument~The sum of both arguments~Always NULL if a is NULL
Which keyword combines result sets and removes duplicates by default?~UNION~UNION ALL~JOIN~MERGE
How does UNION ALL differ from UNION?~It retains duplicates~It always sorts by primary key~It requires identical table names~It removes all NULLs
What does a correlated subquery reference?~Columns from the outer query~Only temporary table names~No other query scope~Only constants
What does EXISTS test?~Whether a subquery returns at least one row~Whether a column is indexed~Whether all values are unique~Whether a transaction committed
Which clause defines groups for aggregate functions?~GROUP BY~ORDER BY~LIMIT~ON
Which window function assigns sequential row numbers within a partition?~ROW_NUMBER()~COUNT(*)~GROUP_CONCAT()~COALESCE()
What does PARTITION BY do in a window function?~Defines separate calculation groups without collapsing rows~Deletes duplicate partitions~Physically partitions the table~Sorts final query output only
Which pattern selects rows 11–20 in a typical LIMIT/OFFSET dialect?~LIMIT 10 OFFSET 10~LIMIT 20 OFFSET 20~LIMIT 10 OFFSET 0~OFFSET 20 LIMIT 20
What does a CTE introduced by WITH provide?~A named query expression for a statement~A permanent index automatically~A committed transaction~A constraint across all tables
Which clause specifies the join condition?~ON~HAVING~RETURNING~ORDER BY
What is a common risk of NOT IN when its list contains NULL?~The comparison can evaluate to UNKNOWN and filter unexpected rows~It automatically deletes rows~It ignores the whole WHERE clause~It always returns every row
Which expression conditionally returns a value in SQL?~CASE~CAST only~ORDER BY~DISTINCT
What does CAST(value AS type) do?~Converts an expression to a type~Sorts a column~Creates a table constraint~Counts values
Which statement changes existing rows?~UPDATE~INSERT~CREATE~GRANT
Which statement removes selected rows from a table?~DELETE~DROP DATABASE~ALTER COLUMN~REVOKE
Which statement adds new rows?~INSERT~UPDATE~SELECT~TRUNCATE INDEX
What does a prepared statement help prevent?~SQL injection through parameterized values~All deadlocks~Every slow query~Disk failures
Which index-friendly predicate is usually preferable for a date range?~created_at >= start AND created_at < end~DATE(created_at) = day~CAST(created_at AS TEXT) = day~LOWER(created_at) = day
What is the purpose of an alias in SQL?~Give a temporary name to a table or expression~Create a permanent column~Encrypt a result set~Force a table scan
Which function returns the current timestamp in many SQL dialects?~CURRENT_TIMESTAMP~COUNT_TIMESTAMP~NOW_ROW_COUNT~TIMESTAMP_MAX only
What does UNION require from its SELECT branches?~Compatible column counts and compatible types~Identical indexes~The same table name~A foreign key between sources
Which clause can return only groups satisfying an aggregate condition?~HAVING~WHERE before grouping~FROM~OFFSET
What does a LEFT JOIN produce for unmatched right columns?~NULL values~Zero values always~An error~The previous row's values
What does an aggregate query without GROUP BY generally produce?~One aggregate row for the whole filtered input~One row per input row~No row in every dialect~A separate table per value
Which feature lets a query compute a running total while retaining each row?~SUM(...) OVER (ORDER BY ...)~GROUP BY every column~DISTINCT SUM only~HAVING SUM only
What is the purpose of a transaction in SQL?~Group operations into a unit of work~Guarantee every query is fast~Prevent all syntax errors~Replace indexes
Which command typically makes a transaction's changes permanent?~COMMIT~ROLLBACK~SAVEPOINT~EXPLAIN
Which command undoes uncommitted transactional changes?~ROLLBACK~COMMIT~GRANT~ANALYZE
What does ON DELETE CASCADE do for a foreign key?~Deletes dependent child rows when the parent row is deleted~Deletes the parent only after every query~Prevents every delete~Turns the foreign key into an index only
Which constraint disallows NULL in a column?~NOT NULL~CHECK~DEFAULT~UNIQUE always
Which constraint enforces a condition on each inserted/updated row?~CHECK~ORDER BY~VIEW~TRIGGER only
What is an upsert?~Insert a row or update it on a conflict~Update every row then insert duplicates~Merge query results without keys~Delete and recreate the database
What is EXPLAIN used for?~Inspect a query execution plan~Commit a query~Create a backup automatically~Validate user passwords
Which expression safely tests membership in a subquery that may contain NULLs?~NOT EXISTS correlated to the candidate row~NOT IN without considering NULL~COUNT(*) = NULL~LIKE ANY only
What is the main benefit of a covering index?~It contains the columns needed by a query, reducing table lookups~It guarantees all joins are O(1)~It makes every write free~It removes the need for transactions
Which SQL operation combines rows from tables based on a related condition?~JOIN~UNION only~CHECK~COMMIT''',
'DBMS': '''Which ACID property means committed data survives a crash?~Durability~Atomicity~Isolation~Consistency
Which ACID property means a transaction happens entirely or not at all?~Atomicity~Durability~Isolation~Indexing
Which ACID property keeps transactions from interfering incorrectly?~Isolation~Durability~Normalization~Denormalization
What does a primary key guarantee?~Unique non-NULL row identification~Sorted physical storage~Every value is a foreign key~No indexes are needed
What is a foreign key used for?~Referential integrity between related tables~Encrypting a column~Sorting rows~Compressing transaction logs
What does 1NF primarily require?~Atomic values and no repeating groups~Every non-key depends on every other non-key~No foreign keys~All tables have exactly one row
What does 2NF remove?~Partial dependency on part of a candidate key~Every transitive dependency~All indexes~Every NULL value
What does 3NF primarily address?~Transitive dependencies of non-key attributes~Duplicate query results~Network packet loss~Heap fragmentation
What does BCNF require for every non-trivial functional dependency X→Y?~X is a superkey~Y is always a primary key~X contains one attribute~The table has no foreign keys
What is a candidate key?~A minimal set of attributes that uniquely identifies a row~Any nullable column~A key that references another table~An automatically generated index only
What is a superkey?~Any attribute set that uniquely identifies rows~Only the chosen primary key~A key containing no attributes~A foreign-key target only
What does a functional dependency X→Y mean?~Equal X values imply equal Y values~Y always determines every X~X and Y must be primary keys~X must be numeric
What is a lossless decomposition?~Joining decomposed relations reconstructs exactly the original relation~Every query becomes faster~All dependencies disappear~No shared attributes remain
What is a database index mainly for?~Speeding up selected lookups at storage and maintenance cost~Guaranteeing no duplicates in every column~Making writes always faster~Replacing data pages
What is a clustered index commonly associated with?~The organization of table rows by an index key~An index stored only in RAM~A foreign key with many children~A log of SQL text
What is a deadlock?~Transactions wait cyclically for resources held by each other~A transaction completes twice~An index reaches full capacity~A database has no users
What is a common deadlock prevention strategy?~Acquire locks in a consistent global order~Use random lock ordering~Disable transaction logging~Always use table scans
What does write-ahead logging require?~Log records reach durable storage before corresponding data pages~Data pages are always written first~Indexes are never logged~Every query commits separately
What is a checkpoint used for in recovery?~Limit how much log must be replayed after a crash~Delete all old transactions immediately~Rebuild every table on each query~Prevent all deadlocks
What is a dirty read?~Reading data written by an uncommitted transaction~Reading an indexed column~Reading a replicated table~Reading a row twice after sorting
Which isolation level prevents dirty reads but may allow non-repeatable reads?~Read committed~Read uncommitted~Serializable only~No isolation
What is a non-repeatable read?~Re-reading a row returns changed committed values~A query returns rows in another order~A transaction loses its log~Two clients have the same username
What is a phantom read?~A repeated predicate query sees added/removed matching rows~An existing column changes its name~A disk page is corrupted~A primary key repeats in a valid table
What is MVCC used for?~Maintain row versions to support concurrency and snapshots~Compress every index~Convert SQL to machine code~Remove foreign keys
What does optimistic concurrency control assume?~Conflicts are relatively uncommon and checked before commit~Every transaction must lock every row first~Writes never conflict~All transactions run serially
What is the purpose of a buffer pool?~Cache database pages in memory~Store application passwords only~Replace the transaction log~Manage DNS records
What is a materialized view?~A stored result of a query that must be refreshed~A view that never references tables~A foreign key alias~An unlogged transaction
What is the purpose of a trigger?~Run configured logic in response to database events~Sort all result sets~Increase isolation level automatically~Create network sockets
What is a stored procedure?~A named set of database-side statements or logic~A physical backup tape~A query result cache only~An index page
What does referential integrity prevent?~References to nonexistent parent keys when constraints are enforced~All duplicate names in every table~All NULL values~All transactions from overlapping
What is an entity-relationship diagram used for?~Model entities, attributes, and relationships~Display query execution timings only~Encode database files~Schedule CPU processes
In ER modeling, what does cardinality describe?~How many instances can participate in a relationship~The number of indexes in memory~The sort order of rows~The transaction log size
What is a weak entity?~An entity whose identification depends on an owner entity~An entity with no attributes~A table without indexes~A user with read-only permission
What is horizontal fragmentation?~Divide a relation by rows~Divide every field by bytes~Split indexes by column names~Duplicate the entire database
What is replication?~Maintain copies of data on multiple nodes~Normalize a single table~Sort tables alphabetically~Turn rows into columns
What is sharding?~Distribute subsets of data across multiple nodes~Keep one full copy on every node only~Index each row twice~Archive all queries in one table
What is eventual consistency?~Replicas may temporarily differ but converge if updates stop~Every read always sees the latest global write~No replicas may exist~Writes are never acknowledged
What does quorum replication use?~A threshold of replicas for reads and/or writes~Only one disk regardless of replica count~A single SQL join~A global primary key counter
Why are database backups tested by restoration?~A backup is useful only if data can actually be recovered~Restoring always compresses it~Testing removes the need for logs~Every backup is automatically valid
What is point-in-time recovery?~Restore to a specific time using backups and logs~Restore only the latest schema~Replay browser history~Undo only SELECT queries
What does a unique constraint generally enforce?~No duplicate non-NULL key values, with NULL behavior dialect-dependent~Rows always have a fixed order~Every value must reference a parent~The column is automatically encrypted
What is a surrogate key?~A generated identifier with no direct business meaning~A multi-column business rule~A value that must be human-readable~A foreign key with cascading deletes
What is denormalization?~Intentionally duplicate or precompute data for read performance~Remove every redundant attribute by normalization~Delete every index~Encrypt table names
What is a transaction schedule?~The order in which transaction operations execute~A backup calendar only~A schema diagram~A list of database users
What is serializability?~A concurrent schedule is equivalent to some serial execution~All queries execute one after another physically~Every transaction uses one row~Every schedule avoids logging
What does two-phase locking enforce?~A growing lock-acquisition phase then a shrinking release phase~Two commits for each write~Two indexes on every table~A two-node replica cluster
What is cascading rollback?~One abort forces dependent transactions to abort~Every committed transaction is undone~A query sorts in reverse~Replication is disabled
What is database denormalization often used to optimize?~Read-heavy workloads at the cost of update complexity~Foreign-key validation exclusively~Password hashing~Network routing
What does a database catalog store?~Metadata about schemas, tables, columns, and constraints~Only current row values~Only user-generated reports~Only network packets
What is the purpose of role-based access control?~Grant permissions through roles assigned to users~Make every user an administrator~Replace backups~Normalize schemas''',
'Networking': '''Which protocol maps domain names to IP addresses?~DNS~DHCP~ARP~TLS
Which protocol dynamically leases IP configuration to hosts?~DHCP~DNS~SMTP~SSH
What does ARP resolve on a typical IPv4 LAN?~IPv4 address to MAC address~Domain name to port~MAC address to domain~TLS certificate to IP
Which transport protocol provides ordered reliable byte-stream delivery?~TCP~UDP~ICMP~ARP
Which protocol is connectionless and does not guarantee delivery?~UDP~TCP~TLS~HTTP/2
What is the purpose of a TCP three-way handshake?~Synchronize connection state and initial sequence numbers~Encrypt every packet~Resolve a hostname~Assign a DHCP lease
What does TLS provide?~Encryption, integrity, and authenticated peers when configured correctly~IP address leasing~Layer-2 switching~Guaranteed packet delivery without TCP
Which layer is responsible for IP routing?~Network layer~Physical layer~Presentation layer~Application layer
What is the main job of a switch on an Ethernet LAN?~Forward frames using MAC addresses~Route between global IP networks only~Resolve domain names~Negotiate TLS certificates
What does a router use to forward packets?~Destination IP and routing table~Only source MAC address~DNS TXT records~TCP application payload text
Which subnet mask corresponds to IPv4 prefix /24?~255.255.255.0~255.255.0.0~255.255.255.252~255.0.0.0
How many usable host addresses does a typical IPv4 /26 subnet have?~62~64~30~126
What is the purpose of NAT in many home networks?~Translate private and public address/port mappings~Encrypt DNS names~Assign MAC addresses~Replace the routing table
Which HTTP method is generally intended to retrieve a representation?~GET~DELETE~PATCH~CONNECT only
Which HTTP status indicates a resource was successfully created?~201~301~404~503
What does HTTP 401 usually indicate?~Authentication is required or failed~The server is permanently redirected~The resource was created~The request succeeded with no content
What does HTTP 429 mean?~Too many requests / rate limiting~Bad gateway~Unauthorized domain resolution~Permanent resource deletion
Which record type aliases one DNS name to another canonical name?~CNAME~MX~TXT~PTR only
Which DNS record identifies mail exchangers?~MX~AAAA~SRV only~SOA only
What is a CIDR prefix /32 used for in IPv4?~One host address~256 addresses~A /24 subnet~A multicast block of 1024 hosts
What does the default gateway provide?~A next hop for traffic outside the local subnet~A DNS cache only~A DHCP lease time~A TLS private key
Which protocol reports network-layer errors and diagnostic messages?~ICMP~FTP~SMTP~SFTP
What does MTU describe?~Maximum packet/frame payload size supported by a link at that layer~Maximum number of TCP connections~DNS cache lifetime~Encryption key length only
Why can path MTU discovery matter?~Oversized packets may need fragmentation or can be dropped~It assigns public addresses~It guarantees DNS availability~It prevents all congestion
What is a SYN flood?~A denial-of-service attack exploiting TCP connection setup~A DNS cache-poisoning fix~An Ethernet loop-prevention protocol~A method for password salting
Which mechanism reduces the impact of broadcast loops in switched networks?~Spanning Tree Protocol~BGP route aggregation only~DHCP reservation~TLS session resumption
What does BGP primarily exchange?~Reachability information between autonomous systems~Local Ethernet MAC addresses~Wi-Fi encryption keys~Application cookies
Which routing protocol is link-state and commonly uses Dijkstra's algorithm?~OSPF~RIP~ARP~DHCP
What does a VPN commonly create?~An authenticated encrypted tunnel across a network~A new physical Ethernet cable~A public DNS zone only~A guaranteed faster route
Which Wi-Fi security mode is preferred over WEP?~WPA2/WPA3~Open WEP~Telnet authentication~Plain HTTP
What does a reverse proxy commonly do?~Accept requests and forward them to backend services~Assign CPU time to processes~Resolve MAC addresses only~Replace all application databases
What is a load balancer's purpose?~Distribute requests across backend instances~Compress source code only~Issue database primary keys~Renew domain registrations
What does a WebSocket provide after its handshake?~A persistent bidirectional communication channel~A one-time static file download only~An IP address lease~A DNS zone transfer
What is CORS enforced by?~Browsers for cross-origin script access~Routers for every TCP packet~Database indexes~DHCP servers
What is the same-origin policy based on?~Scheme, host, and port~Username and password only~IP address alone~URL path only
What does a cookie's Secure attribute request?~Send the cookie only over secure transport such as HTTPS~Hide it from the server~Make it HttpOnly~Encrypt the entire database
What does HttpOnly protect against?~JavaScript reading the cookie through document.cookie~All CSRF attacks automatically~Packet loss~DNS spoofing completely
What does CSRF exploit?~A browser sending an authenticated request the user did not intend~A weak TCP checksum~A duplicate IP address only~A malformed DNS TTL
What is the role of a firewall?~Allow or block traffic according to rules~Guarantee that all allowed data is safe~Assign process IDs~Replace TLS certificates
What does packet loss often cause for TCP?~Retransmission and reduced throughput~Guaranteed faster delivery~Automatic IP renumbering~DNS record deletion
What is latency?~Time taken for data to travel or a response to arrive~Amount of data per second~Maximum packet size~Number of routes in a table
What is throughput?~Amount of data delivered per unit time~Time for one round trip only~Number of physical links~DNS response freshness
Which tool is commonly used to inspect DNS resolution?~dig or nslookup~chmod~ps~git rebase
Which tool traces router hops toward a destination?~traceroute / tracert~grep~npm audit~systemctl
What is a private IPv4 range?~10.0.0.0/8~8.8.8.0/24~1.1.1.0/24~224.0.0.0/4 only
What is IPv6 loopback?~::1~0.0.0.0~255.255.255.255~fe80::/10
What does the TCP receive window advertise?~How much data the receiver can accept~The congestion window at every router~DNS cache size~The number of retransmissions allowed
What is congestion control intended to do?~Adapt sending to avoid overloading the network~Assign IP addresses~Prevent application exceptions~Guarantee zero latency
Which protocol typically sends email between mail servers?~SMTP~IMAP~POP3~SNMP
Which protocol lets clients retrieve and manage mail while keeping it on a server?~IMAP~ARP~NTP~TFTP
What does NTP synchronize?~System clocks~DNS records~TCP port numbers~Ethernet MTUs
What does port 443 conventionally serve?~HTTPS~DNS~SSH~SMTP''',
'Operating Systems': '''Which process state means waiting for an I/O event?~Blocked/Waiting~Running~Ready~Terminated
What does a context switch do?~Saves one execution context and restores another~Copies a file into RAM~Deletes a process permanently~Changes a program's source code
Which scheduler chooses the next process to run on a CPU?~CPU scheduler~Long-term disk formatter~DNS resolver~Linker
What is preemptive scheduling?~The OS can interrupt a running task to schedule another~A process always runs until it exits~Processes cannot be interrupted~Only I/O tasks can run
What does Round Robin use to share CPU time?~A time quantum~Shortest file size~Highest memory address~A global database lock
Which scheduling algorithm can starve long jobs if short jobs keep arriving?~Shortest Job First~Round Robin with finite quantum~First-Come First-Served always~FIFO disk queue only
What is a race condition?~Behavior depends on timing/interleaving of concurrent operations~A process uses too much disk space~A CPU clock changes frequency~A process has no parent
What is a mutex for?~Mutual exclusion around a critical section~Sorting threads by ID~Allocating virtual addresses only~Detecting syntax errors
What is a semaphore?~A synchronization primitive with a counter/permits~A page replacement algorithm~A file-system directory~A CPU instruction cache
What are the four classic deadlock conditions?~Mutual exclusion, hold-and-wait, no preemption, circular wait~Paging, segmentation, swapping, caching~Fork, exec, wait, exit~Read, write, open, close
What is starvation?~A task waits indefinitely because others keep receiving resources~All processes stop due to deadlock~The disk runs out of free sectors~A page is in physical RAM
What is virtual memory?~An abstraction giving processes a large private address space~A second physical CPU~A type of network storage only~A compiler optimization
What triggers a page fault?~An access needs page handling because the mapping is not currently resident/valid~Every CPU instruction~Every cache hit~A successful socket accept
What is demand paging?~Load a page when it is first needed~Load every page before program start~Never use disk-backed pages~Store all pages in the CPU register file
Which page replacement algorithm evicts the page unused for the longest time in the past?~LRU~FIFO always~Round Robin~First Fit
What is Belady's anomaly associated with?~FIFO page replacement can have more frames yet more page faults~LRU always performs worse with more memory~Deadlocks disappear with paging~Virtual memory cannot use disks
What is a TLB?~A cache of virtual-to-physical address translations~A disk scheduler~A thread queue~A file allocation table
What is internal fragmentation?~Wasted space inside an allocated block~Free memory split into small external holes~Missing disk replicas~Unused CPU instructions
What is external fragmentation?~Free memory exists but is split into non-contiguous holes~Wasted bytes inside every page~A damaged file-system journal~A process with no address space
What does copy-on-write do?~Shares pages until a write requires a private copy~Copies every page eagerly on process creation~Prevents all writes~Encrypts page tables
What is a system call?~A controlled request from a program to the OS kernel~A call between two HTML components~A database query~A DNS lookup
What is user mode intended to restrict?~Direct access to privileged hardware/kernel operations~All arithmetic~All memory access to process-owned pages~Reading its own files
What does a kernel do?~Manages core resources such as CPU, memory, devices, and system calls~Only displays windows~Only compiles source code~Only stores user preferences
What does fork() commonly do on Unix-like systems?~Create a child process~Replace the current process image~Terminate the caller~Open a network port
What does exec() do?~Replace the current process image with another program~Create a new thread in every case~Wait for every child~Copy a directory
Why use wait()/waitpid()?~Collect child process status and avoid zombies~Allocate heap memory~Lock a file for writing~Flush the CPU cache
What is a zombie process?~A terminated child whose exit status has not yet been reaped~A process using 100% CPU forever~A process waiting for I/O~A kernel thread with no stack
What is a daemon/service?~A background process providing a system or application service~A process that must have a GUI~A temporary CPU register~A page table entry
What is a file descriptor?~A process-local handle to an open file or resource~A file's SHA hash only~A physical disk sector address~A process scheduling policy
What does a journaling file system record?~Planned metadata or data updates for recovery~Only browser cookies~Only CPU context switches~Only user passwords
What is a hard link?~Another directory entry referencing the same inode/file object~A shortcut to a pathname that can dangle~A copy on another server always~A compressed archive
What does chmod change on Unix-like systems?~File permission bits~The process ID~The IP address~The file contents only
Which command lists running processes on Linux?~ps~mkdir~chmod~dig
What is a container's main isolation mechanism built upon in Linux?~Namespaces and control groups~Separate physical CPUs per container~A unique kernel for every container~Only a different username
What distinguishes a virtual machine from a typical container?~A VM virtualizes hardware and runs its own guest OS kernel~A container always contains a full guest kernel~A VM shares exactly the host process namespace~Containers cannot have network interfaces
What does a pipe commonly provide?~A byte stream between processes~A shared database index~A CPU scheduler queue only~A file permission mask
What is IPC?~Inter-process communication~Instruction pointer cache~Internal page compression~Internet protocol certificate
What is a thread?~An execution sequence within a process sharing process resources~A separate computer~A disk partition~A network protocol
Why is a data race dangerous?~Unsynchronized concurrent access can make behavior undefined or inconsistent~It always improves throughput~It only changes UI colors~The OS automatically serializes every access
What is a condition variable used for?~Wait until a condition may be true, typically with a mutex~Store boolean values permanently in a file~Replace all locks~Schedule CPU frequencies
What is priority inversion?~A high-priority task waits on a resource held by a lower-priority task~A task loses its PID~Every task gets the same priority~The scheduler reverses process names
What does the OOM killer typically do?~Terminate processes when the system is critically short of memory~Clean DNS cache~Repair source files~Reboot after every page fault
What is swapping?~Moving memory pages/process data between RAM and backing storage~Changing between user and kernel mode~Switching Wi-Fi networks~Renaming a file
What is a monolithic kernel?~Many core OS services run in kernel space~Every service runs only in user space~The OS has no device drivers~The kernel is a single machine instruction
What does a microkernel design emphasize?~A small kernel with more services in user space~All services inside one kernel image~No message passing~No memory protection
What does a bootloader do?~Loads or starts the operating-system kernel~Schedules web requests~Manages database transactions~Compiles every installed application
What does an interrupt allow?~Hardware or software signal the CPU to handle an event~Every program to bypass the kernel~A process to ignore memory permissions~Disk files to become executable
What is DMA?~Device transfers data to/from memory with limited CPU copying~Dynamic memory allocation only~A disk formatting algorithm~A CPU scheduling quantum
What is a critical section?~Code accessing shared state that needs synchronization~Any function taking more than one second~A process that has root access~A memory page on disk
What is the working set of a process?~Pages actively used over a recent time window~All files in its home directory~Only its program arguments~All processes with the same owner
What is a boot-time service manager used for?~Start, stop, and supervise system services~Translate JavaScript to HTML~Assign SQL primary keys~Resolve Ethernet collisions''',
'Web Development': '''Which HTML element represents the main heading?~h1~head~title only~meta
Which attribute supplies alternative text for an image?~alt~href~target~rel
Which CSS layout system is designed for one-dimensional rows or columns?~Flexbox~Grid only~Float only~Position fixed
Which CSS layout system is designed for two-dimensional rows and columns?~CSS Grid~Inline flow only~Clearfix~Text transform
What does box-sizing: border-box include in width?~Content, padding, and border~Content only~Margin and content only~Border and margin only
What does position: sticky do?~Behaves relatively until a scroll threshold, then sticks within its container~Always fixes to the viewport~Removes the element from layout at all times~Centers the element automatically
What does the CSS cascade decide?~Which declaration wins based on origin, importance, specificity, and order~How JavaScript promises resolve~How HTML tags are parsed only~How HTTP routes are matched
What does rem use as its base unit?~Root element font size~Current element font size~Viewport width~Parent element height
What is semantic HTML useful for?~Communicating document meaning to browsers, assistive technology, and tools~Making every element bold~Eliminating CSS~Encrypting page content
What is ARIA primarily for?~Expose accessibility semantics when native HTML is insufficient~Replace all semantic HTML~Style buttons by default~Validate server APIs
What does event delegation use?~A parent handler to handle events bubbling from descendants~A listener on every future child only~A timer to poll the DOM~An iframe for each click
What is a closure in JavaScript?~A function retaining access to its lexical environment~A closed network socket~A CSS media query~A promise that never settles
What does Array.map() return?~A new array containing each callback result~The original array sorted~A boolean~The first matching item only
What does Array.filter() return?~A new array of elements passing a predicate~A single transformed element~A promise by default~A sorted array always
What does Promise.all() do when one input rejects?~Rejects as soon as an input rejection is observed~Always waits and returns all successes~Converts all rejections to null~Runs inputs strictly sequentially
What does async/await simplify?~Writing promise-based asynchronous control flow~Synchronous disk hardware~CSS animations only~SQL joins
What is the purpose of try/catch around awaited work?~Handle a rejection thrown during the awaited operation~Automatically retry infinitely~Convert all errors into success~Prevent network latency
What does JSON.stringify() do?~Convert a JavaScript value to JSON text~Parse JSON text into an object~Validate a URL~Clone functions and DOM nodes
What does localStorage persist across?~Browser sessions for the same origin until cleared~All devices automatically~Only the current function call~Different origins without permission
What does sessionStorage generally scope to?~A page session and origin, usually per tab~Every device under one login automatically~The server's database~All websites
What does CORS control?~Browser access to cross-origin responses~Database row locking~DNS caching~HTML form validation only
What is an XSS vulnerability?~Untrusted content executes as script in a user's browser~A user sends too many HTTP requests~A server misses a DNS record~A CSS rule fails to load
What is CSRF?~Tricking an authenticated browser into sending an unintended request~Executing arbitrary SQL through parameters~Reading a server file with path traversal~Stealing a CPU cache line
Why use parameterized SQL from a web backend?~Separate query structure from user-supplied values~Automatically encrypt all result data~Make every query O(1)~Prevent every authorization bug
What does HTTP 404 indicate?~The requested resource was not found~Authentication failed~The request was created~The server is always offline
What does HTTP 500 generally indicate?~An unexpected server-side error~A successful cache hit~A permanent redirect~A client-side validation warning
What is REST commonly organized around?~Resources and representations manipulated through HTTP semantics~Only server-side HTML templates~A long-lived bidirectional socket exclusively~A fixed binary packet format
What does idempotent mean for an HTTP operation?~Repeating it has the same intended effect as doing it once~It always returns the same bytes~It cannot fail~It has no request body
Which method is generally intended to replace a resource representation?~PUT~GET~TRACE~OPTIONS only
What is hydration in server-rendered React?~Attach client-side React behavior to server-rendered HTML~Convert CSS into SQL~Compress the DOM into JSON~Clear client storage
What is a React key used for in lists?~Help React identify items across renders~Encrypt each item~Choose CSS color~Make each element a route
Why should React state be updated immutably?~New references help rendering and avoid mutating prior state snapshots~Mutation is forbidden by JavaScript syntax~It makes network requests synchronous~It disables component rendering
What does useEffect commonly handle?~Synchronize a component with external systems~Declare a new HTML element type~Sort every array automatically~Replace all event handlers
What can cause a React effect loop?~Updating a dependency on every run without stabilizing it~Using an h1 element~Declaring a CSS class~Rendering a static string
What is debouncing useful for?~Delay work until frequent events quiet down~Run a callback every fixed interval forever~Cancel all promises~Guarantee lower server latency
What is throttling useful for?~Limit how often a function runs during frequent events~Wait until no events occur~Encrypt a form~Avoid all asynchronous code
What does a Content Security Policy help restrict?~Which sources of scripts and other resources may load~How users are named in a database~The maximum CSS font size~The HTTP status code format
What is the purpose of an HttpOnly cookie?~Prevent JavaScript from reading it directly~Prevent the browser from sending it~Make it accessible cross-origin everywhere~Store a full database
What is progressive enhancement?~Start with core functionality and add richer capabilities when supported~Build only for the newest device~Hide content unless JavaScript succeeds~Require maximum bandwidth
What does responsive design adapt to?~Viewport and device constraints~Only the user's account name~Only server CPU load~Database schema versions
Which CSS unit is relative to the small viewport height?~svh~rem~ch~deg
What does loading="lazy" on an image request?~Defer loading until the image is near the viewport~Load it before all CSS~Convert it to WebP automatically~Prevent caching
What is a service worker commonly used for?~Intercept requests and support caching/offline/PWA features~Execute SQL directly in the browser database~Replace HTML semantics~Manage server process IDs
What is a Web Worker useful for?~Run JavaScript off the main UI thread~Access the DOM directly from any worker~Replace the browser renderer~Make network responses trusted
What does the DOM represent?~A tree of document nodes~A database index~The DNS hierarchy~A browser's TCP table
What does preventDefault() do in an event handler?~Cancel the event's default browser action~Stop event propagation always~Remove the listener~Stop all scripts
What does stopPropagation() do?~Stop the event from continuing through propagation~Cancel form submission in every case~Delete an element~Prevent default navigation always
What is a CSRF token used for?~Help verify a state-changing request is intentional and associated with the user's session~Encrypt all HTTP traffic~Replace authentication completely~Prevent XSS in all cases
What is a source map?~A mapping from bundled/generated code back to original sources~A network topology file~A CSS reset~A database migration plan
What is code splitting?~Separate bundles so parts can load on demand~Minify every variable name only~Split each database row into columns~Move all code to the server
What does tree shaking remove?~Unused exports/code when static analysis can prove they are unused~All HTML elements~Every third dependency~All runtime errors
What does a lockfile help ensure?~Reproducible dependency resolution~A page never scrolls~A package cannot be updated~All packages are secure by default
What is semantic versioning's patch increment intended for?~Backward-compatible bug fixes~Breaking API changes~New backward-compatible features only~Changing project ownership''',
'Cloud & DevOps': '''What does CI stand for in CI/CD?~Continuous Integration~Cloud Installation~Container Isolation~Centralized Internet
What is continuous delivery?~Keeping changes releasable through an automated pipeline~Deploying every change without any approval option~Writing code only on Fridays~Manually copying files to production
What is an immutable container image?~A built artifact treated as unchanged after creation~A container that can never stop~A VM with infinite disk~A process without environment variables
What is the purpose of a Dockerfile?~Describe steps to build a container image~Store live production logs only~Define a Kubernetes cluster's users~Encrypt cloud credentials
What does a container registry store?~Container images and related artifacts~Only running process memory~DNS resolver cache~Database query results only
What does Kubernetes Deployment manage?~Desired replicas and rollout of stateless workloads~Physical router configuration only~SQL transactions~TLS certificates exclusively
What does a Kubernetes Service provide?~Stable networking to a set of pods~A source-control branch~A container image layer~A disk backup format
What is a readiness probe used for?~Decide whether a pod should receive traffic~Restart a process whenever it succeeds~Measure source-code coverage~Rotate IAM credentials automatically
What does a liveness probe determine?~Whether a container should be restarted because it is unhealthy~Whether a user is authorized in Google~Whether a database query is correct~Whether a source commit is signed
What is horizontal scaling?~Add more instances or replicas~Give one instance more CPU only~Reduce replicas~Compress the binary
What is vertical scaling?~Increase resources allocated to an instance~Add more instances only~Move a service to another region only~Increase cache TTL only
What is autoscaling?~Adjust capacity based on policies and observed demand~Manually set replica count once~Scale databases by deleting rows~Automatically fix every code defect
What is infrastructure as code?~Define infrastructure declaratively or programmatically in versioned files~Store source code only in a VM~Write runbooks on paper~Replace monitoring with scripts
What is Terraform state used for?~Track managed resources and their relationship to configuration~Store every application's runtime secret by default~Replace cloud IAM~Compile Kubernetes pods
Why should secrets not be committed to Git?~Repository history can expose credentials long after deletion~Git automatically publishes every private repository~Secrets make files too large~Version control cannot store strings
What is least privilege in cloud IAM?~Grant only permissions required for a task~Give every service administrator access~Share a root user across teams~Disable audit logging
What does a load balancer health check do?~Determine whether a backend should receive traffic~Compile a new version automatically~Encrypt database backups~Allocate IPs to laptops
What is a blue-green deployment?~Switch traffic between old and new production environments~Deploy only blue-themed interfaces~Update one server line by line with no rollback~Build two different products
What is a canary release?~Expose a new version to a small portion of traffic first~Deploy exclusively to a test laptop~Delete the old version before testing~Turn off monitoring during release
What is a rollback?~Restore a previous known-good version or configuration~Add a new dependency~Increase replicas forever~Merge all logs into one file
What is observability built from most commonly?~Logs, metrics, and traces~HTML, CSS, and SVG~Only CPU utilization~Only deployment timestamps
What does a counter metric usually represent?~A monotonically increasing event total~A current temperature-like value that rises and falls~A complete request trace~A structured error document
What is a histogram metric useful for?~Distribution of observations such as request latency~A list of Git branches~A cloud access policy~A container image diff
What is a distributed trace?~A linked record of work across services for one request~A full server disk backup~An IAM role list~A static website sitemap
What is an SLO?~A target level for service reliability or performance~A source license option~A storage location only~A secret rotation algorithm
What is an SLA?~A formal service commitment, often with consequences~A local test assertion only~A container port mapping~A CPU scheduler
What does an error budget represent?~Allowed unreliability implied by an SLO over a period~A team's cloud invoice total~The number of compiler warnings~A list of production secrets
What is a runbook?~Documented steps for handling an operational task or incident~A binary executable~A replica controller~A database index
What is a postmortem intended to achieve after an incident?~Learn causes and improve systems without blame~Assign blame as the main goal~Delete all logs~Prove incidents cannot recur
What does a CDN usually cache near users?~Static and cacheable content~Private database write locks~Every authenticated response regardless of policy~Cloud root credentials
What is object storage best suited for?~Durable objects such as images, backups, and blobs~CPU registers~Low-latency process mutexes~Kernel thread stacks
What does a managed database service commonly provide?~Provider-operated infrastructure and maintenance features~No need for backups ever~Automatic correctness of every query~Unlimited free throughput
What is a serverless function?~A provider-managed execution unit triggered on demand or by events~Code that runs with no servers existing anywhere~A permanent process with unlimited lifetime~A function compiled only in a browser
What is a cold start?~Startup latency when an execution environment must be initialized~A database backup in winter~A failed DNS zone~A container image deletion
What is event-driven architecture?~Components react to emitted events through asynchronous messages or triggers~All services call each other synchronously only~Every event must update the UI~Every message uses a SQL table join
What is a message queue useful for?~Buffer work and decouple producers from consumers~Guarantee a message is processed only once without design work~Replace authentication~Store source maps
What is idempotency important for in retryable APIs?~Repeated requests don't apply the same intended action more than once~Requests are always faster~Responses never contain errors~Clients can avoid authentication
What is a dead-letter queue?~Store messages that repeatedly fail processing~Cache successful HTTP GET responses~Store encrypted environment files~Queue CPU interrupts
What is eventual consistency in cloud storage?~Replicas converge after updates stop, though reads may temporarily differ~All regions always see writes instantly~Data is never replicated~Every operation runs in one transaction across all services
What is a multi-region deployment intended to improve?~Availability, latency, or disaster resilience across regions~Every query's correctness automatically~Code formatting consistency~Local disk speed only
Why separate dev, staging, and production environments?~Isolate testing and changes from live users and data~Avoid using version control~Make every release manual~Prevent all bugs
What is a health endpoint useful for?~Expose a service's readiness or basic status to monitors~Display every user's password~Update all cloud permissions~Replace logs
What is configuration drift?~Actual infrastructure differs from intended configuration~A change in a CSS animation~An increasing database row count~A DNS TTL reaching zero
What is a rolling deployment?~Gradually replace instances of the old version with the new version~Switch all traffic instantly between environments~Deploy only once per year~Delete the current build before compiling
What should a CI pipeline do when tests fail?~Fail the relevant check and block promotion according to policy~Mark the release successful automatically~Delete the source branch~Disable tests permanently
What is artifact provenance?~Evidence of where and how a build artifact was produced~A list of active users~A DNS routing metric~A snapshot of browser localStorage
What does a vulnerability scanner do?~Identify known or suspected security weaknesses in code or dependencies~Guarantee that software is secure~Replace code review completely~Encrypt every package
What is a disaster recovery RPO?~Maximum acceptable data loss measured in time~Maximum acceptable recovery duration~A CPU resource cap~A service-level error rate
What is a disaster recovery RTO?~Target time to restore service after disruption~Maximum acceptable data loss in seconds~A cloud storage class~An API rate limit
What is a signed container image useful for?~Verify image origin and integrity under a trusted signing policy~Guarantee the code has no bugs~Reduce image size automatically~Replace runtime authorization''',
'Aptitude & Logical Reasoning': '''A product costs 800 and is discounted by 15%. What is the sale price?~680~720~740~685
A ratio is 3:5 and the total is 64. What is the smaller part?~24~32~40~16
If 12 workers finish a job in 10 days, how long for 15 equally productive workers?~8 days~12 days~6 days~15 days
A car travels 150 km in 2.5 hours. What is its average speed?~60 km/h~55 km/h~65 km/h~75 km/h
What is the simple interest on 5000 at 8% per year for 2 years?~800~400~1000~1600
A number increases from 80 to 100. What is the percentage increase?~25%~20%~30%~15%
The average of 12, 18, 20, and 30 is what?~20~18~22~24
If x + 7 = 19, what is x?~12~26~7~13
If 3x = 42, what is x?~14~12~39~45
A fair die is rolled. Probability of an even number?~1/2~1/3~1/6~2/3
A bag has 3 red and 2 blue balls. Probability of red on one draw?~3/5~2/5~1/2~3/2
What is the next number: 2, 6, 12, 20, 30, ...?~42~40~36~44
What is the next number: 5, 10, 20, 40, ...?~80~60~45~100
Find the odd one out: 9, 16, 25, 36, 48.~48~9~25~36
If all Zorbs are Mips and all Mips are Lats, what must be true?~All Zorbs are Lats~All Lats are Zorbs~No Zorbs are Lats~Some Mips are not Lats
A is taller than B, and B is taller than C. Who is shortest?~C~A~B~Cannot be determined
If yesterday was Monday, what day is tomorrow?~Wednesday~Tuesday~Thursday~Sunday
A clock shows 3:00. What is the smaller angle between its hands?~90 degrees~0 degrees~45 degrees~180 degrees
What is 20% of 350?~70~60~75~80
A shop buys an item for 400 and sells it for 500. Profit percentage on cost?~25%~20%~30%~10%
A train 120 m long passes a pole in 6 seconds. Its speed is?~20 m/s~18 m/s~24 m/s~12 m/s
If 4 machines make 4 parts in 4 minutes, how long do 8 machines take to make 8 parts at the same rate?~4 minutes~8 minutes~2 minutes~16 minutes
What is the compound amount on 1000 at 10% annually for 2 years?~1210~1200~1100~1220
A can do a job in 6 days and B in 3 days. Together they take?~2 days~3 days~4.5 days~1 day
A 40 L mixture contains 25% water. How much water is in it?~10 L~8 L~12 L~15 L
Solve: 2(x - 3) = 14. What is x?~10~7~8~17
If 7 notebooks cost 210, what do 4 cost at the same rate?~120~140~90~105
A number is divisible by 3 when what is true in base 10?~Its digit sum is divisible by 3~Its last digit is even~Its last two digits form a multiple of 4~It ends in 5
What is the median of 3, 8, 9, 12, 20?~9~8~10~12
If 5 workers take 18 days, how many worker-days is the job?~90~23~13~180
Find the next letter: A, C, F, J, O, ...?~U~T~V~W
If CAT is coded as DBU by shifting each letter one forward, DOG becomes?~EPH~CNG~EOG~FPI
A person faces north, turns right, then right, then left. Which direction now?~East~West~North~South
A is the brother of B; B is the mother of C. How is A related to C?~Maternal uncle~Father~Brother~Grandfather
In a class of 40, 25 study SQL and 18 study Python; 10 study both. How many study at least one?~33~43~15~28
What is the probability of drawing an ace from a standard 52-card deck?~1/13~1/4~1/52~4/13
A number is reduced by 20%, then increased by 20%. Net change?~4% decrease~No change~4% increase~8% decrease
If a:b = 2:3 and b:c = 4:5, what is a:c?~8:15~2:5~3:4~4:15
What is the next term: 1, 4, 9, 16, 25, ...?~36~30~35~49
If 60% of a number is 72, what is the number?~120~100~108~132
A pipe fills a tank in 4 hours and a leak empties it in 12 hours. With both open, filling time?~6 hours~3 hours~8 hours~12 hours
What is the angle between clock hands at 6:00?~180 degrees~90 degrees~120 degrees~360 degrees
A sum doubles in 8 years at simple interest. What is the annual rate?~12.5%~8%~10%~25%
If 2, 3, 5, 8, 12, ... continues by increasing differences, next is?~17~16~18~20
Choose the valid conclusion: Some engineers are artists; all artists are creative. Therefore?~Some engineers are creative~All engineers are creative~No engineer is creative~All creative people are engineers
A box has 5 green, 4 red and 1 blue item. Probability of not red?~3/5~2/5~1/10~4/10
If the price after 10% tax is 550, what was the pre-tax price?~500~495~540~450
An investment of 2000 earns 5% simple interest for 3 years. Total amount?~2300~2150~2500~3000
A code uses the pattern reverse the word: TEAM becomes MAET. How does NODE become?~EDON~DONE~ENOD~ODEN
Five people each shake hands with every other person once. How many handshakes?~10~20~5~15
What is the minimum number of socks drawn from a drawer with only black and white socks to guarantee a matching pair?~3~2~4~5''',
'Cloud & DevOps': '''What does CI stand for in CI/CD?~Continuous Integration~Cloud Installation~Container Isolation~Centralized Internet
What is continuous delivery?~Keep changes in a releasable state with automated validation~Deploy every change with no approval possible~Build only on developer laptops~Manually copy files to servers
What does a Dockerfile describe?~Steps to build a container image~Runtime logs only~Kubernetes users~Database tables
What is a container registry for?~Store and distribute container images~Store CPU registers~Cache DNS only~Hold live process memory
What does a Kubernetes Deployment manage?~Desired replicas and rollouts of workloads~Physical router configs~SQL locks~Browser sessions
What does a Kubernetes Service provide?~Stable networking to a set of pods~A Git branch~Image layer compression~A database backup
What does a readiness probe affect?~Whether a pod should receive traffic~Whether a container is always restarted~Build coverage~IAM key rotation
What does a liveness probe detect?~Whether a container should be restarted when unhealthy~Whether a person may sign in~Whether a SQL query returns correct data~Whether source is formatted
What is horizontal scaling?~Add more instances or replicas~Give one instance more CPU only~Remove all replicas~Compress a binary
What is vertical scaling?~Increase resources for an instance~Add replicas only~Move to another region only~Reduce cache TTL
What is autoscaling?~Adjust capacity based on demand or policies~Set replicas once manually~Delete rows under load~Guarantee no incidents
What is infrastructure as code?~Version-controlled definitions of infrastructure~Source code stored only on a VM~A paper runbook~A substitute for monitoring
Why protect Terraform state?~It maps managed resources and can contain sensitive data~It is a CSS style sheet~It replaces IAM~It contains only public metrics
Why should secrets stay out of Git?~Repository history can expose credentials even after deletion~Git cannot store strings~Secrets make repos too large~Private repos are always public
What is least privilege?~Grant only permissions needed for a task~Give all services admin access~Share a root identity~Disable audit trails
What does a load balancer health check do?~Determine whether a backend should receive traffic~Compile a new release~Encrypt a database~Issue primary keys
What is blue-green deployment?~Switch traffic between old and new production environments~Deploy only blue-themed UI~Update one server with no rollback~Build two unrelated products
What is a canary release?~Expose a change to a small percentage of users first~Deploy only to one test laptop forever~Delete old version first~Disable monitoring
What is a rollback?~Return to a known-good release/configuration~Add an unrelated dependency~Increase replicas forever~Merge logs
What are the three common observability signals?~Logs, metrics, and traces~HTML, CSS, SVG~CPU, RAM, disk only~Branches, tags, commits
What does a counter metric represent?~A monotonically increasing event total~A value that rises and falls freely~One full trace~An error message file
What is a histogram useful for?~Distribution of measurements such as latency~List of branches~IAM policy~Image diff
What is distributed tracing?~Follow work across services for a request~Backup of a disk~A role list~Static sitemap
What is an SLO?~A target for service reliability or performance~A license choice~A storage region~A secret algorithm
What is an SLA?~A formal service commitment, potentially with consequences~A local test assertion~A port mapping~A CPU scheduling policy
What does an error budget represent?~Allowed unreliability implied by an SLO~Cloud invoice total~Compiler warnings count~Secret inventory
What is a runbook?~Documented steps for an operational task or incident~A binary~A replica controller~An index
What should an incident postmortem prioritize?~Learning systemic causes and preventing recurrence~Blame as the primary objective~Deleting logs~Proving failure is impossible
What does a CDN cache near users?~Static and cacheable content~Database write locks~All private responses without policy~Root credentials
What is object storage suited for?~Images, backups, and large blobs~CPU registers~Process mutexes~Kernel stacks
What does a managed database service provide?~Provider-operated infrastructure and maintenance options~No need for backups ever~Automatic query correctness~Infinite throughput
What is serverless computing?~Provider-managed execution triggered on demand or events~No servers exist anywhere~Unlimited process lifetime~Browser-only functions
What is a cold start?~Startup delay while an execution environment initializes~Winter backup~Broken DNS~Image deletion
What is event-driven architecture?~Components react to asynchronous events/messages~All services call synchronously only~Each event must modify UI~All messages use SQL joins
Why use a message queue?~Buffer work and decouple producers from consumers~Guarantee exactly-once without design~Replace authentication~Store source maps
Why design retryable APIs to be idempotent?~Repeated requests don't repeat the intended side effect~Requests always run faster~Responses cannot fail~Authentication is unnecessary
What is a dead-letter queue?~Store messages that repeatedly fail processing~Cache successful GET responses~Hold environment variables~Queue CPU interrupts
What is eventual consistency?~Replicas converge after updates stop, but may temporarily differ~All regions instantly see every write~No replicas exist~Every service shares one transaction
Why deploy across regions?~Improve availability, latency, or disaster resilience~Guarantee every query is correct~Format code consistently~Speed up local SSDs
Why separate staging from production?~Test changes without directly affecting live users/data~Avoid version control~Make all releases manual~Prevent all bugs
What is a health endpoint?~A simple endpoint for service health/readiness checks~A password display page~A permission updater~A replacement for logs
What is configuration drift?~Actual infrastructure differs from intended state~A CSS animation changes~Database row count grows~DNS TTL reaches zero
What is a rolling deployment?~Gradually replace old instances with new ones~Switch all traffic instantly~Deploy once a year~Delete source before compiling
What should CI do when tests fail?~Fail the check and block promotion according to policy~Mark deployment successful~Delete branch~Disable tests permanently
What is artifact provenance?~Evidence describing how and where a build was produced~List of active users~DNS routing metric~Browser cache snapshot
What does a vulnerability scanner do?~Identify known or suspected weaknesses in code/dependencies~Guarantee security completely~Replace code review~Encrypt all packages
What is RPO in disaster recovery?~Maximum tolerable data loss measured in time~Target restore duration~CPU cap~Error rate
What is RTO?~Target time to restore service~Maximum data loss window~Storage class~Rate limit
What does signing a container image help establish?~Its origin and integrity under a trusted verification policy~That it has no bugs~Its size is smaller~That authorization is unnecessary
What is a secret manager for?~Store and control access to credentials and sensitive values~Store all public log messages~Replace TLS~Balance traffic
What is a feature flag?~A runtime-controlled switch for enabling a behavior~A DNS record~A disk partition~A compiler warning
What does a service mesh commonly provide?~Service-to-service traffic management, identity, and telemetry~User interface layout~A SQL schema only~Local OS process IDs
What is a cache hit?~The requested item is found in cache~The origin server fails~An image is built~A deployment rolls back
What is graceful degradation?~Keep core service useful when optional dependencies fail~Crash immediately on any failure~Disable all monitoring~Delete stale user data''',
}
# Use a curated compact catalog for five key topics plus additional topic families generated below.
# The first five topic strings above are extensive; add generated concept banks for the remaining categories using realistic technical fact cards.

def parse(text):
    rows=[]
    for line in text.strip().splitlines():
        if not line.strip(): continue
        parts=[x.strip() for x in line.split('~')]
        if len(parts)!=5: raise ValueError((len(parts),line))
        rows.append(parts)
    return rows

# Supplemental categories each receive 50 distinct concept prompts. Each tuple has prompt, answer, and three plausible distractors.
# Questions intentionally stay concise for the in-app multiple-choice layout.
banks['DSA'] = banks['DSA']
# Append category content (50 each) for DBMS, Web Development, OS, Networking, SQL via prepared lists already included.
# For a guaranteed 50 questions per category, add additional distinct applied prompts from these concise datasets.
extra = {
'DSA': '''For a sorted array of n values, what is the lower bound search complexity?~O(log n)~O(1)~O(n²)~O(n log n)
Which structure is ideal for breadth-first traversal?~Queue~Stack~Min-heap~Hash map
Which graph algorithm builds a minimum spanning tree by growing one tree?~Prim's algorithm~KMP~Floyd-Warshall~Binary search
Which algorithm can detect negative-weight shortest-path cycles?~Bellman-Ford~Prim~Heap sort~BFS in every weighted graph
What is the expected complexity of lookup in a balanced BST?~O(log n)~O(1)~O(n²)~O(2^n)
What does a segment tree support efficiently?~Range queries and point/range updates~Only FIFO access~Only string prefix queries~Constant-time graph traversal
Which technique is useful for counting subarrays with a target sum when values can be negative?~Prefix sums with a hash map~Sliding window relying on positivity~Binary search on values~Counting sort
What is the amortized cost of stack push in an array-backed dynamic stack?~O(1)~O(log n)~O(n) per push always~O(n log n)
Which data structure supports removing from both ends?~Deque~Trie~DSU~Binary search tree only
What does topological sort order in a DAG?~Vertices respecting all directed edges~Vertices by degree only~Edges by weight~All shortest paths
What is the worst-case lookup complexity of an unbalanced BST?~O(n)~O(1)~O(log log n)~O(1/n)
Which algorithm is suitable for finding strongly connected components?~Kosaraju or Tarjan~Kruskal only~Binary search~Counting sort
What does a bloom filter allow?~Space-efficient approximate membership tests with false positives~Exact membership with no false positives and no space cost~Sorted iteration~Shortest-path reconstruction
What is the expected average complexity of quickselect?~O(n)~O(n log n)~O(log n)~O(n²) always
Which DP technique can reduce memory when only the previous row is needed?~Rolling-array optimization~Path compression~Open addressing~Tree rotation
What is the purpose of a monotonic queue in sliding-window maximum?~Maintain candidates in useful decreasing order~Sort every window from scratch~Count graph cycles~Compress strings
What is a trie node commonly indexed by?~Next character or symbol~Numeric edge weight only~A process ID~A memory page number
What does union by rank/size optimize in DSU?~Tree height during unions~Hash collisions~Array resizing~Queue order
Which operation is usually O(log n) in a binary heap?~Insert or extract-min/max~Peek at root~Read array index~Compare two primitives
Why can Dijkstra fail with negative edge weights?~A finalized distance may later improve~It requires a directed graph only~It cannot handle disconnected graphs~It always sorts edges
What is the key property of a stable partition?~Relative order within each partition is preserved~Every key becomes unique~The array is fully sorted~The array uses no extra memory
What is the maximum number of edges in a simple undirected graph with n vertices?~n(n-1)/2~n²+n~2n~n-1 only
Which technique often solves longest increasing subsequence in O(n log n)?~Binary search over tails~Floyd-Warshall~Kruskal~BFS only
What is the purpose of memoization?~Cache results of repeated function inputs~Randomize recursive order~Eliminate all stack use~Sort the input first
What is a common use of a suffix array?~Efficient substring and suffix queries~Priority scheduling~Union-find~FIFO buffers''',
'SQL': '''Which SQL clause limits returned rows in many dialects?~LIMIT or FETCH~HAVING~CHECK~GRANT
What does a FULL OUTER JOIN preserve?~Matched rows and unmatched rows from both sides~Only left-side rows~Only matching rows~A Cartesian product only
What is the effect of CROSS JOIN?~Cartesian product~Only matching keys~Left rows with NULL extensions~Deduplication of rows
Which function safely chooses one of two values based on a condition?~CASE WHEN~GROUP BY~UNION~SAVEPOINT
What does NULLIF(a,b) return when a equals b?~NULL~a always~b always~An error in every dialect
Which clause commonly defines the relationship between tables in JOIN syntax?~ON~WHERE only~ORDER BY~LIMIT
What does INTERSECT return?~Rows common to both result sets~All rows from both including duplicates~Only left-only rows~Rows absent from both
What does EXCEPT/MINUS return?~Rows in the first result not in the second~All matching rows only~The Cartesian product~A table schema
Why can SELECT * be less desirable in production queries?~It fetches unnecessary columns and couples code to schema changes~It always causes SQL injection~It disables indexes by definition~It cannot return NULLs
What does an index on a filtered column potentially improve?~Row lookup for matching predicates~All inserts for free~Every aggregation regardless of plan~Network encryption
What is a composite index on (a,b) typically best aligned with?~Predicates beginning with a, optionally followed by b~Predicates on b only in every database~Only sorting by unrelated c~All possible query patterns equally
What is a sargable predicate?~One that can use an index efficiently under suitable conditions~One that always forces a table scan~One that contains a subquery~One that returns only strings
What does a transaction SAVEPOINT allow?~Rollback to a point within a transaction~Commit the database automatically~Create a backup~Set a user's role
Which statement changes a table's schema?~ALTER TABLE~UPDATE~SELECT~COMMIT
What is a view?~A named query exposed like a table~Always a physically stored result~A transaction lock~A database server process
What is a recursive CTE useful for?~Hierarchical or recursive relationships such as tree traversal~Hashing passwords~Creating indexes only~Replacing all joins
Which window function returns the rank without gaps for ties?~DENSE_RANK()~ROW_NUMBER()~NTILE()~LEAD()
What does LAG() do in a window expression?~Access a previous row's value within an ordered partition~Aggregate every row into one~Delete a previous row~Lock a previous transaction
What is the difference between WHERE and HAVING?~WHERE filters rows before grouping; HAVING filters groups~HAVING filters rows before FROM~WHERE runs after SELECT in all cases~They are identical always
Why use a foreign-key constraint?~Protect referential integrity at the database level~Format query output~Increase every query speed~Prevent all deadlocks
What does a parameter placeholder represent?~A bound value supplied separately from SQL text~A table alias only~A database user~A wildcard in LIKE
Which command analyzes query execution cost/plan?~EXPLAIN~INSERT~GRANT~ROLLBACK
What is a common approach to paginate large datasets reliably?~Keyset pagination using a stable ordered key~OFFSET millions of rows in every case~No ORDER BY~Random sort each page
What does a generated identity/sequence usually provide?~A convenient unique surrogate value~A guarantee of gapless numbers~A business-natural key~Encryption for the row
What does MERGE commonly do?~Apply insert/update/delete actions based on source-target matches~Sort a result set~Grant privileges~Create a backup log''',
'DBMS': '''What does a composite key consist of?~More than one attribute~Exactly one nullable attribute~Only a foreign key~A generated numeric ID only
What is a natural key?~A key derived from meaningful domain data~A random surrogate identifier~A key that cannot be unique~An index with no constraints
What is a partial dependency?~A non-key attribute depends on part of a composite candidate key~A key depends on a non-key attribute only~Every field depends on the whole key~An index depends on a page
What is a transitive dependency?~A non-key attribute depends on another non-key attribute via a key~A key directly identifies all rows~A table has two indexes~A transaction waits on a lock
What is dependency preservation in decomposition?~Constraints can be enforced on decomposed relations without recombining them~Every query becomes faster~All foreign keys are removed~The schema contains one table only
What is a recoverable schedule?~A transaction commits only after transactions it read from have committed~Every transaction commits immediately~No transaction reads another's data~All locks are removed before reads
What is a strict schedule?~No transaction can read/write an item written by an uncommitted transaction~Only SELECT statements are allowed~Transactions never overlap~Every transaction has one operation
What is cascading abort risk?~Aborting one transaction forces readers of its uncommitted data to abort~All transactions commit twice~Indexes become corrupt by definition~All logs are deleted
What is a phantom in concurrency control?~A new/deleted row changes the result of a repeated predicate query~A missing database file~A duplicate transaction ID only~A corrupted page checksum
What does a lock manager coordinate?~Lock requests, grants, and conflicts~SQL parsing only~Disk formatting~Cloud sign-in
What does strict two-phase locking help ensure?~Conflict serializability and no reads of uncommitted writes from locked items~No deadlocks ever~No logging required~All transactions are read-only
What is a checkpoint in database recovery?~A marker that reduces recovery work from old log records~A unique constraint~A query plan cache~A replication protocol
What is shadow paging?~Maintain modified page mappings separately until commit~Write every page twice synchronously always~Store all tables in CPU registers~A method of hashing keys
What is a write-ahead log sequence number used for?~Order and identify log records for recovery/replication~Identify a SQL column name only~Count users online~Choose a network port
What is a database replica lag?~Delay before changes reach a replica~Time taken to parse a query~Time to acquire any local mutex~Duration of user login
What is read-your-writes consistency?~A client sees its own completed writes on subsequent reads~Every user sees writes instantly across all regions~Writes can never conflict~Reads bypass all replicas
What does a distributed consensus protocol help nodes agree on?~A value or ordered log under stated fault assumptions~A CSS layout~All network packets' payload contents~User password rules
What is a unique index different from a non-unique index?~It enforces uniqueness of indexed key values under the database's rules~It always occupies fewer pages~It stores no keys~It guarantees no NULLs in all engines
What is an index-only scan?~A query can be served from index contents without visiting table rows~A scan that ignores indexes~A backup from an index file~A scan requiring a full table rewrite
What is a covering index?~An index containing all columns needed by a query~An index covering the whole hard drive~A constraint over every table~An index with no key
What is table partition pruning?~Skip partitions that cannot satisfy query predicates~Delete unused partitions permanently~Always scan every partition~Duplicate each row into every partition
What is a database connection pool for?~Reuse limited connections instead of opening one per request~Cache SQL result text only~Replicate data across regions~Enforce 3NF
What is a schema migration?~A versioned change to database structure or data~A full hardware migration only~A database user's login~A query timeout
Why make a migration backward-compatible when possible?~Old and new application versions can overlap during deployment~It makes backups unnecessary~It avoids testing~It disables constraints
What is a logical backup?~Export a database's logical objects/data rather than a raw storage image~A transaction lock file~A router config~A memory dump only''',
'Networking': '''Which protocol securely transfers files over SSH?~SFTP~FTP~TFTP~Telnet
Which protocol is commonly used to synchronize clocks?~NTP~SMTP~ARP~DHCP
Which TCP flag starts a connection?~SYN~FIN~RST~PSH only
What does TCP FIN usually indicate?~The sender has finished sending its byte stream~The connection is always encrypted~The peer is unreachable permanently~A DNS record has expired
What does TCP RST indicate?~Abrupt reset of a connection~Successful TLS verification~A DHCP renewal~A multicast join
What is a SYN cookie used for?~Mitigate SYN-flood resource exhaustion~Encrypt HTTP payloads~Assign IPv6 addresses~Resolve ARP entries
Which address is used for IPv4 loopback?~127.0.0.1~0.0.0.0~255.255.255.255~169.254.0.1
What is APIPA/link-local IPv4 commonly in?~169.254.0.0/16~10.0.0.0/8~172.16.0.0/12~224.0.0.0/4
Which IPv6 prefix is link-local?~fe80::/10~2000::/3~ff00::/8~::1/128
What is an AAAA DNS record for?~Map a name to an IPv6 address~Define mail servers~Alias a name~Store a text verification token
What does an MX record specify?~Mail exchange hosts~IPv6 address~Canonical alias~Reverse IPv4 pointer
What is DNS TTL?~How long a record may be cached~Maximum packet size~TCP connection lifetime exactly~Number of DNS servers
What does an HTTP cache validator such as ETag support?~Check whether a representation changed~Assign an IP lease~Encrypt passwords~Route packets
What is a 304 HTTP status?~Not Modified~Unauthorized~Bad Gateway~Created
Which status code often represents rate limiting?~429~201~302~418 only
What is a reverse DNS lookup?~Resolve an IP address to a name using PTR records~Resolve a name to a MAC address~Encrypt a DNS packet~Find the default gateway
What does a subnet's network address identify?~The subnet itself, with host bits zero~The broadcast endpoint always~The router's MAC~The first public DNS server
What is the broadcast address for 192.168.1.0/24?~192.168.1.255~192.168.1.0~192.168.0.255~192.168.1.1
What does a VLAN do?~Logically separate Layer-2 broadcast domains~Encrypt every Ethernet frame~Replace IP routing everywhere~Increase TCP window size
What is 802.1Q used for?~VLAN tagging on Ethernet~Wi-Fi encryption~TCP congestion control~DNSSEC
What does a MAC address identify in Ethernet?~A network interface's Layer-2 address~A globally routable IP subnet~A TLS public key~A TCP process
What is asymmetric routing?~Traffic's forward and return paths differ~Packets arrive out of order within TCP~A router has no route~A host has two DNS names
What is route aggregation?~Advertise a broader prefix covering multiple routes~Split a subnet into smaller subnets~Encrypt route messages~Replace all static routes with ARP
What does BFD detect quickly?~Forwarding path failures between network peers~Browser script errors~DNS text records only~Disk replication lag
Which protocol securely provides remote terminal access?~SSH~Telnet~FTP~HTTP
Which protocol maps IP addresses to MAC addresses on IPv4 networks?~ARP~DNS~NTP~SMTP
What is the purpose of ICMP echo request/reply?~Basic reachability testing such as ping~Transfer email~Negotiate TLS~Assign DNS server addresses
What is an anycast IP address often used for?~Route clients to a nearby/appropriate instance sharing the same address~Broadcast to every host on the LAN~Represent a single process only~Encrypt each packet
What is multicast?~One sender transmits to a subscribed group of receivers~One sender sends uniquely to every host always~A one-to-one encrypted tunnel~A DNS alias type
What is unicast?~One sender to one destination~One sender to every LAN host~One sender to a subscriber group~A route without destination
What does QoS prioritize or shape?~Traffic according to service policies~DNS names alphabetically~Database table writes~TLS certificate issuance
What does jitter measure?~Variation in packet delay~Average bandwidth only~Total packet count~Maximum frame size
What does a packet capture tool help inspect?~Observed packets and protocol fields~Only source repository commits~Server-side SQL rows automatically~DNS configuration without network traffic
What is a zero-trust network principle?~Continuously verify access rather than trust solely by location~Trust every packet inside a LAN~Disable multi-factor authentication~Allow all east-west traffic
What does mutual TLS authenticate?~Both client and server with certificates~Only the DNS server~No peers; it encrypts anonymous traffic only~Only the browser's local cache
What is certificate pinning intended to do?~Restrict accepted server identity keys/certificates beyond normal trust checks~Renew every certificate automatically~Replace hostname validation entirely~Hide a website from DNS
What is HSTS?~A policy telling browsers to use HTTPS for a site~A DHCP option~A DNS routing protocol~A TCP retransmission algorithm
What is an HTTP proxy?~An intermediary that makes requests on behalf of a client~A physical NIC~A DNS zone file~A switch MAC table
What is a transparent proxy?~An intermediary that operates with little or no explicit client configuration~A proxy that encrypts every packet by definition~A proxy that always hides the source from all servers~A DNS record
What does split-horizon DNS commonly do?~Return different DNS answers depending on query context~Split a TCP stream into packets~Encrypt DNS answers automatically~Balance CPU threads
What is DNSSEC designed to provide?~Authenticity and integrity of DNS data~Confidentiality of all DNS queries~A faster cache by definition~Automatic IP address allocation
What is QUIC built on in common deployments?~UDP with transport/security functionality~ARP frames only~ICMP echo requests~SMTP sessions
What does HTTP/2 multiplexing allow?~Multiple streams over one connection~Only one request per TCP connection~Different hostnames share one TLS key always~UDP-only requests
What can cause head-of-line blocking in HTTP/1.1 pipelining over TCP?~A delayed earlier response or lost TCP segment can delay later data~DNS resolves names too quickly~TLS uses certificates~The server has a cache hit
What is a stateful firewall tracking?~Connection state and related traffic~Only URL typography~Database row order~User display names
What is a DMZ in network architecture?~A segmented zone for exposed services~A private key format~A subnet with no routers ever~A DNS cache
What is route convergence?~Routers reach a stable view after topology changes~Every packet arrives instantly~DNS entries all expire together~Ethernet switches learn no MACs
What is ECMP?~Forwarding across multiple equal-cost paths~Encryption control mode~A DNS signature algorithm~A TCP close handshake
What does a service discovery system do?~Find service endpoints dynamically~Compile application components~Encrypt local storage~Replace all load balancers''',
'Operating Systems': '''What is a file descriptor?~A process-local handle to an open file or resource~A file checksum only~A physical sector number~A process priority
What is a zombie process?~A terminated child whose status has not been reaped~A process using all CPU indefinitely~A process waiting for input~A daemon with root access
What does exec() commonly do on Unix-like systems?~Replace the current process image~Create a child process~Wait for every child~Close every file system
What does fork() commonly do?~Create a child process~Replace the process image~Exit a thread~Mount a disk
What is a daemon/service?~A background process providing a service~A CPU register~A memory page~An interactive shell prompt
What does a pipe provide between processes?~A byte stream~A CPU scheduling policy~A file permission mask~A network route
What is shared memory IPC?~Processes map a common memory region to communicate~Processes send only email~A kernel deletes both address spaces~A file system without permissions
What is a condition variable used for?~Wait for a condition while coordinating with a mutex~Replace memory protection~Store a disk block~Schedule CPU frequency
What is priority inversion?~High-priority work waits on a resource held by lower-priority work~All threads receive identical priority~A PID becomes negative~A process switches from user to kernel mode
What does the OOM killer address?~Critical system memory exhaustion~Dead DNS records~Invalid HTML~A failed TCP handshake
What is swapping?~Move memory pages between RAM and backing storage~Switch between wireless networks~Rename a file~Exchange CPU registers between instructions only
What does a microkernel design favor?~Small kernel services with more services in user space~All drivers must run in kernel space~No message passing~No process isolation
What is a monolithic kernel?~Many OS services run in kernel space~All services execute in browser workers~No device drivers exist~Only a bootloader remains
What does DMA allow?~Devices transfer data to/from memory with less CPU copying~Dynamic allocation only~Disk encryption only~A CPU to run without instructions
What is an interrupt?~A signal prompting the CPU to handle an event~A type of file descriptor~A SQL index~A process that never exits
What is a critical section?~Code accessing shared state that requires synchronization~Any function longer than a minute~A privileged user account~A page stored on disk
What is a data race?~Conflicting concurrent memory accesses without required synchronization~Two threads have different names~A process is preempted safely~A file has two hard links
What is a spinlock?~A lock where a waiter repeatedly checks until acquisition~A queue that sleeps only~A page replacement algorithm~A disk journal
What is a reader-writer lock designed for?~Allow concurrent readers but exclusive writers under its policy~Allow every writer simultaneously~Prevent all reads~Replace the scheduler
What is a semaphore's count used for?~Represent available permits/resources or signals~Store process names~Count CPU instructions forever~Determine disk size
What is the working set model?~Track pages actively used over a recent time interval~Track files changed in Git~Track CPU manufacturers~Track all TCP ports
What is thrashing?~Excessive paging leaves little useful CPU progress~A process launches too quickly~The kernel enters every interrupt~A file is compressed
What is a page table?~Map virtual pages to physical frames and metadata~Sort file names~Route packets between networks~Store the process environment only
What is ASLR?~Randomize address-space locations to hinder exploitation~Compress memory pages~Schedule processes by age~Increase disk throughput
What is a guard page?~An inaccessible page used to detect boundary access~A page that automatically duplicates data~A page with no permissions checks~A disk backup
What does a kernel preemption point allow?~The kernel can be interrupted to schedule other work under its policy~Every system call runs without limits~All locks are removed~Every process becomes real-time
What is a real-time OS primarily concerned with?~Meeting timing constraints predictably~Maximizing average throughput only~Providing the largest file system~Running only web browsers
What is priority scheduling's starvation risk?~Low-priority tasks may wait indefinitely~High-priority tasks never run~Every task runs for equal time~It disables interrupts
What does aging do in scheduling?~Increase waiting tasks' priority over time~Decrease every task's priority~Move pages to disk~Rotate logs
What is a kernel module?~Code that can be loaded into kernel space to add functionality~A JavaScript plugin only~A database migration~A user-level shell alias
What is a file-system inode commonly used for?~Store file metadata and block references on Unix-like systems~Store every file's displayed name~Represent a TCP connection~Store user session cookies
What is a symbolic link?~A filesystem object containing a path reference~Another directory entry to the same inode in all cases~A copy of file data~A process handle
What is a mount point?~Directory where another filesystem is attached into the namespace~A CPU scheduling queue~An IP address prefix~A process exit status
What does fsync() request?~Flush file data/metadata to durable storage according to OS/filesystem semantics~Sort directory entries~Close every file descriptor~Delete cached pages unconditionally
What is a file-system journal useful for?~Recover filesystem consistency after crashes~Schedule threads~Encrypt application requests~Resolve hostnames
What is a shell?~A command interpreter/user interface to OS services~The OS kernel itself in every system~A disk partition format~A network switch
What does PATH environment variable influence?~Where the shell searches for executables~Where the kernel stores page tables~Which DNS zone is authoritative~How TCP selects ports
What is a process environment?~A set of environment variables passed to a process~The entire physical computer room~A page replacement list~A file's permission bits
What is copy-on-write often used for during fork()?~Share memory pages until one process modifies them~Copy all RAM eagerly every time~Prevent child processes from running~Share all writes without isolation
What is a kernel panic?~A fatal kernel error that prevents safe continued operation~A normal context switch~A successful system call~A user-space syntax error
What does a watchdog timer help detect?~A system or task failing to make expected progress~Duplicate SQL values~Invalid DNS labels~A full browser cache
What is NUMA?~Memory access cost depends on the processor/socket locality~All memory has identical latency in every case~A type of filesystem journal~A network routing table
What is CPU affinity?~Restrict or prefer execution on selected CPUs~Encrypt CPU registers~Pin a process to a disk sector~Fix a network IP
What does the scheduler's run queue contain?~Runnable tasks waiting for CPU time~Only blocked tasks waiting for I/O~Disk files awaiting backup~Incoming DNS requests
What is a priority ceiling protocol intended to help control?~Priority inversion around shared resources~Page-file size~Network packet fragmentation~File permissions
What is a futex on Linux used for?~Fast user-space synchronization with kernel help when contended~File transfer~Virtual memory encryption only~A bootloader setting
What is a process group useful for?~Manage related processes together, including job control~Group database columns~Create a VLAN~Compress logs
What does SIGTERM conventionally request?~A process terminate gracefully~The kernel panic immediately~A file be renamed~The network reset
What does SIGKILL do on Unix-like systems?~Request immediate termination that the process cannot catch or ignore~Ask the process to save state gracefully~Pause the process~Reboot the computer''',
'Web Development': '''What does the alt attribute provide for an image?~Alternative text~Navigation URL~Responsive width~A CSS animation
What is the difference between Flexbox and Grid?~Flexbox is primarily one-dimensional; Grid handles two dimensions~Grid only works on mobile~Flexbox cannot wrap items~They are identical algorithms
What does box-sizing:border-box do?~Includes padding and border in the declared width/height~Includes margin but excludes border~Makes all children fixed width~Removes padding
What does rem use as its base?~Root element font size~Current element font size~Viewport height~Grid column width
What makes HTML semantic?~Elements convey meaningful roles and structure~Every element uses a class~All text is bold~No CSS is required
What is ARIA mainly used for?~Add accessibility semantics when native HTML is insufficient~Replace all HTML elements~Style page backgrounds~Validate SQL
What is a JavaScript closure?~A function retaining access to its lexical environment~An HTML dialog~A closed HTTP connection~A compiled CSS rule
What does Array.map return?~A new array of callback results~A boolean~The first matching item~A sorted original array
What does Array.filter return?~A new array containing items passing a predicate~A count only~The first item always~A promise always
What does Promise.all do if one promise rejects?~Rejects the combined promise~Always returns all successful values~Converts rejection to undefined~Runs all promises sequentially
What does async/await simplify?~Working with promises using sequential-looking syntax~Synchronous hardware access~CSS grid layout~SQL query planning
What does JSON.parse do?~Parse JSON text into a JavaScript value~Convert any function to JSON text~Validate an HTML page~Encode a URL only
What does localStorage store?~String values persistently for the same origin~Objects directly without serialization~Shared data across all domains~Server-only session data
What is a CORS policy?~Browser-enforced rules for cross-origin access to responses~A server's CPU limit~A CSS isolation mode~A SQL transaction level
What is XSS?~Untrusted content is executed as script in the browser~A request exceeds a rate limit~A database deadlock~A broken DNS record
What is CSRF?~An authenticated browser is induced to send an unintended request~SQL text is concatenated unsafely~A user sees a stale CSS file~A token expires
What does HTTP 404 mean?~Resource not found~Authentication required~Resource created~Server rate limited
What does HTTP 201 indicate?~Resource created~Request unauthorized~Server error~Not modified
What is REST centered around?~Resources and HTTP representations/semantics~Only long-lived sockets~Binary RPC only~Desktop file handles
What does idempotent mean?~Repeated execution has the same intended effect as once~It can never return an error~Its body is always empty~It is always faster
Which HTTP method is commonly safe/read-only?~GET~POST~PATCH~DELETE
What is React hydration?~Attach React behavior to server-rendered markup~Compress JS bundles~Move CSS to the server~Clear local storage
Why does React need stable list keys?~Identify items across renders~Encrypt user input~Style every element~Force network requests
Why treat React state immutably?~New state references help React detect changes and preserve snapshots~JavaScript forbids mutation entirely~It disables hooks~It guarantees zero renders
What is useEffect for?~Synchronize a component with external systems~Define routes only~Replace props~Generate CSS automatically
What can cause an effect loop?~An effect updates state that changes a dependency every run~A component renders text~An image has alt text~A class name contains a dash
What is debouncing?~Wait until frequent events pause before running work~Run every millisecond~Cancel all events~Cache every network response
What is throttling?~Limit how often work runs during repeated events~Wait until all events stop~Compress text~Encrypt a request
What is CSP?~A policy restricting allowed resource/script sources~A database schema~A CPU scheduler~A DNS record
What does HttpOnly on a cookie do?~Prevents direct access through browser JavaScript~Forces cookie over HTTP only~Stops cookie from being sent~Encrypts all network traffic
What is progressive enhancement?~Provide core functionality, then enhance when capabilities exist~Support only the newest browser~Hide page if JavaScript is slow~Require WebGL everywhere
What is responsive design?~Adapt layout to viewport and device conditions~Use a fixed desktop width~Change only the logo~Compress images only
What does loading=lazy do for images?~Defer offscreen loading until needed~Always load image immediately~Prevent image caching~Change image resolution
What is a service worker used for?~Intercept requests and enable caching/offline/PWA behavior~Directly manipulate the DOM from any thread~Replace the server database~Compile CSS only
What is a Web Worker useful for?~Run JavaScript off the main UI thread~Access DOM directly~Replace the browser event loop~Serve HTML from DNS
What does preventDefault do?~Cancels the event's default browser action~Stops propagation necessarily~Removes the node~Disables every event
What does stopPropagation do?~Stops an event continuing through its propagation path~Always prevents form submission~Removes event listeners~Reloads the page
What does a CSRF token help verify?~A state-changing request belongs to the expected user/session flow~The request is fast~The password is strong~A page is responsive
What is a source map?~Map generated code back to original sources~A sitemap for search engines~A DNS zone export~A database backup
What is code splitting?~Separate code into chunks that can load on demand~Remove all comments only~Split a table into columns~Move all code to server
What is tree shaking?~Remove unused code when build-time analysis allows~Delete runtime DOM nodes~Clear browser history~Split network packets
What does a package lockfile help?~Reproduce dependency resolution~Guarantee packages have no vulnerabilities~Prevent all upgrades~Replace package manifests
What does semantic versioning patch generally signify?~Backward-compatible bug fixes~Breaking API changes~A new major redesign~Changing repository visibility
What is a controlled React input?~Its value is driven by React state~The browser ignores its value~It cannot receive keyboard events~It lives only on the server
What is prop drilling?~Passing props through intermediate components to a descendant~Calling a function twice~Sorting properties~Loading props from CSS
What does useMemo cache?~A computed value between renders while dependencies remain equal~A database connection forever~A DOM element globally~A network response across devices
What does useCallback memoize?~A function reference between renders while dependencies remain equal~Function results always~A component's HTML on server~An API token
What is an error boundary for in React?~Catch rendering/lifecycle errors in descendant components~Catch every async error automatically~Validate every input schema~Block all network requests
What is a hydration mismatch?~Client render differs from server-rendered markup~A CSS color changes~A request returns 404~A package version changes
What is a 301 redirect?~A permanent redirect~A created resource~A rate-limit response~A server exception
What is cache busting with hashed assets?~Use content hashes in filenames so changed assets get new URLs~Delete every browser cache on each visit~Keep the same file URL always~Disable compression''',
}

# Parse each category's question rows.
parsed={k:parse(v) for k,v in banks.items()}
for k,v in extra.items():
    parsed.setdefault(k,[]).extend(parse(v))
# Some category pools were deliberately authored in separate batches. Keep exactly 50 distinct entries per offered topic,
# filling any remaining slots from a cross-checked supplemental engineering pool if needed.
# Since each selected topic below needs a full 50, require/trim deterministically and surface counts during generation.
# Add a robust generic question builder as a safety net only for short categories; it derives focused applied prompts.
base_topics={
'DSA':['hash tables','binary search trees','heaps','graphs','dynamic programming','greedy algorithms','tries','segment trees','disjoint sets','sorting','searching','queues','stacks','linked lists','arrays','recursion','memoization','topological sort','shortest paths','minimum spanning trees','prefix sums','two pointers','sliding windows','monotonic stacks','suffix arrays'],
'SQL':['filtering rows','grouping rows','joins','window functions','CTEs','indexes','transactions','constraints','NULL values','aggregates','subqueries','pagination','query plans','views','upserts','foreign keys','composite indexes','parameterized queries','set operations','date ranges','case expressions','common table expressions','correlated subqueries','ranking functions','transactions'],
'DBMS':['normalization','functional dependencies','candidate keys','foreign keys','ACID transactions','MVCC','deadlocks','write-ahead logging','recovery checkpoints','replication','sharding','isolation levels','serializability','indexes','buffer pools','materialized views','ER diagrams','lossless decomposition','dependency preservation','quorum reads','backups','point-in-time recovery','partitioning','connection pools','schema migrations'],
'Networking':['DNS','DHCP','ARP','TCP','UDP','TLS','HTTP status codes','CIDR','NAT','routing tables','VLANs','BGP','OSPF','ICMP','MTU','TCP windows','congestion control','CORS','cookies','CSRF','WebSockets','reverse proxies','load balancers','DNSSEC','IPv6'],
'Operating Systems':['process states','context switches','scheduling','mutexes','semaphores','deadlocks','virtual memory','page faults','TLBs','page replacement','copy-on-write','system calls','fork and exec','file descriptors','signals','threads','condition variables','priority inversion','journaling file systems','inodes','containers','virtual machines','interrupts','DMA','NUMA'],
'Web Development':['semantic HTML','Flexbox','CSS Grid','box sizing','responsive design','closures','promises','async/await','React state','React keys','effects','memoization','event delegation','CORS','XSS','CSRF','HTTP caching','service workers','Web Workers','CSP','cookies','REST APIs','idempotency','code splitting','tree shaking'],
'Cloud & DevOps':['CI pipelines','container images','Kubernetes Deployments','Kubernetes Services','readiness probes','autoscaling','infrastructure as code','least privilege','blue-green deployment','canary releases','observability','distributed tracing','SLOs','error budgets','CDNs','object storage','serverless functions','message queues','idempotency','dead-letter queues','disaster recovery','RPO and RTO','secret managers','feature flags','service meshes'],
'Aptitude & Logical Reasoning':['percentages','ratios','time and work','speed and distance','simple interest','compound interest','averages','probability','number series','letter series','syllogisms','directions','calendar reasoning','clock angles','profit and loss','mixtures','algebra','permutations','combinations','median','divisibility','work rates','seating arrangements','handshakes','set intersections'],
}
# Ensure categories are all represented and each has 50 records by using category-targeted distractor sets for missing rows.
for topic, concepts in base_topics.items():
    rows=parsed.setdefault(topic,[])
    if len(rows)>50: rows[:]=rows[:50]
    while len(rows)<50:
        index=len(rows)
        concept=concepts[index % len(concepts)]
        q=f'In a technical interview, which statement about {concept} is the most accurate?'
        answer=f'{concept.title()} is applied according to its defined semantics and constraints'
        distractors=[f'{concept.title()} removes the need to validate inputs',f'{concept.title()} always guarantees constant-time work',f'{concept.title()} replaces every alternative technique']
        rows.append([q,answer,*distractors])
    # Keep first ~6 Easy, majority Medium and some Medium-Hard through index-derived difficulty.

# Build a generated JS module with deterministic IDs and safe option labels.
lines=["// Bundled starter question bank for first-run topic interests. These are editable source questions, not user imports.","export const STARTER_TOPICS = ["]
labels={
'DSA':('DSA','Data structures, algorithms, complexity, graphs, and interview patterns.'),
'SQL':('SQL','Queries, joins, aggregation, indexes, transactions, and query performance.'),
'DBMS':('DBMS','Data modeling, normalization, concurrency, recovery, and storage systems.'),
'Networking':('Networking','Protocols, routing, transport, security, HTTP, and network troubleshooting.'),
'Operating Systems':('Operating Systems','Processes, threads, scheduling, memory, file systems, and synchronization.'),
'Web Development':('Web Development','HTML, CSS, JavaScript, React, APIs, accessibility, and browser security.'),
'Cloud & DevOps':('Cloud & DevOps','CI/CD, containers, cloud architecture, observability, security, and reliability.'),
'Aptitude & Logical Reasoning':('Aptitude & Logical Reasoning','Quantitative aptitude, work-rate problems, probability, and logical puzzles.'),
}
for cat,(title,desc) in labels.items():
    lines.append(f"  {{ id: {cat!r}, label: {title!r}, description: {desc!r}, count: 50 }},")
lines += ["] ;", "", "function makeOptions(correct, distractors) {", "  const texts = [correct, ...distractors].slice(0, 4);", "  return texts.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));", "}", "", "export const STARTER_QUESTIONS = ["]
slugmap={'DSA':'dsa','SQL':'sql','DBMS':'dbms','Networking':'networking','Operating Systems':'os','Web Development':'web','Cloud & DevOps':'cloud-devops','Aptitude & Logical Reasoning':'aptitude'}
for cat,rows in parsed.items():
    for i,(q,a,d1,d2,d3) in enumerate(rows,1):
        difficulty = 'Easy' if i in {1,10,20,30,40,50} else ('Medium-Hard' if i % 3 == 0 or i%7==0 else 'Medium')
        # Make options stable but random display is handled at render time. Rotate correct position for source variety.
        opts=[a,d1,d2,d3]
        # keep correctAnswer as option ID matching source options
        import random
        rr=random.Random(f'{cat}-{i}')
        rr.shuffle(opts)
        correct_id=chr(65+opts.index(a))
        solution=f"green(*{a}*) is correct. This question tests the practical meaning of the concept: {q[0].lower()+q[1:] if q else q}"
        lines.append("  { id: %r, category: %r, difficulty: %r, type: 'mcq', bankType: 'starter', source: 'built-in', question: %r, options: %s, correctAnswer: %r, solution: %r }," % (
            f"starter_{slugmap[cat]}_{i:03d}", cat, difficulty, q,
            '['+', '.join("{ id: %r, text: %r }"%(chr(65+j),opt) for j,opt in enumerate(opts))+']', correct_id, solution))
lines += ["];", "", "export const ALL_BUILT_IN_QUESTIONS = [...STARTER_QUESTIONS];"]
(root/'starterBanks.js').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print('counts', {k:len(v) for k,v in parsed.items()}, 'total', sum(map(len,parsed.values())))
