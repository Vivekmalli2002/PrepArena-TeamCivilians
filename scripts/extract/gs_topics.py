"""Re-files the YCT General Studies questions (ancient & medieval history, modern India, geography, science & technology) under finer chapters.

    python3 -I scripts/extract/gs_topics.py

The first extraction put each question under the first of a few broad keyword rules, so most of a book ended up in one or two big buckets
(e.g. 659 "Personalities & miscellaneous modern India"). Here every question is scored against every chapter's keywords (question text counts
double, answer options and the book's explanation count once) and filed under the best-scoring chapter. Only the YCT books are touched: Shyam
institute mock-test questions and every other source keep the topics they already have.
Writes data/gs-topics.json (question id -> chapter); scripts/prepare-content.mjs applies it.
"""
import json, re, collections
from pathlib import Path

root = Path(__file__).resolve().parents[2]

T = {
"gs-ancient-medieval": [
 ("Prehistory & Stone Age cultures", r"palaeolithic|paleolithic|mesolithic|neolithic|chalcolithic|stone age|bhimbetka|mehrgarh|microlith|megalith|iron age|copper hoard|prehistoric|burzahom|chirand|stone tool"),
 ("Indus Valley Civilisation", r"harapp|indus valley|mohenjo|lothal|kalibangan|dholavira|chanhudaro|rakhigarhi|great bath|bronze dancing|citadel|indus civili|seal"),
 ("Vedic Age", r"vedic|rigveda|rig veda|yajur|samaveda|sama veda|atharva|brahmana|upanishad|aranyaka|aryan|\bsabha\b|samiti|purusha|vedanga|smriti|dharmasutra|gotra|sutra"),
 ("Mahajanapadas, Magadha & Persian-Greek invasions", r"mahajanapada|magadh|bimbisara|ajatashatru|haryanka|shishunaga|\bnanda|kosala|vajji|avanti|janapada|alexander|porus|persian|achaemenid|darius|taxila|kalinga war"),
 ("Buddhism", r"buddh|tripitaka|stupa|vihara|bodhi|gautama|siddhartha|sarnath|ashvaghosha|mahayana|hinayana|theravada|council|dhamma|\bpali\b|lumbini|kushinagar"),
 ("Jainism", r"jain|mahavira|tirthankar|digambar|svetambar|parshvanath|kevala|syadvada|bhadrabahu"),
 ("Mauryan Empire & Ashoka", r"maurya|ashoka|asoka|chandragupta maurya|kautilya|arthashastra|megasthenes|indica|bindusara|edict|mauryan|pillar|dhamma mahamatta"),
 ("Post-Mauryan: Shungas, Satavahanas, Kushans & Indo-Greeks", r"shunga|sunga|kanva|satavahana|kushan|kanishka|indo-greek|menander|\bsaka|parthian|gandhara|mathura school|gautamiputra|vima|kharavela|cheti|pushyamitra|hala"),
 ("Sangam Age & early South India", r"sangam|\bchera|pandya|tolkappiyam|silappadikaram|manimekalai|tamilakam|kalabhra|muvendar|tamil|kaveripattinam|puhar|karikala|senguttuvan"),
 ("Gupta Empire", r"gupta|samudragupta|chandragupta ii|vikramaditya|kumaragupta|skandagupta|fa-?hien|kalidasa|allahabad pillar|aryabhatta|aryabhata|varahamihira|navaratna|vishakhadatta|brahmagupta"),
 ("Harsha & post-Gupta kingdoms", r"harsha|vardhana|hiuen|xuan|pushyabhuti|maukhari|kannauj|\bbana\b|harshacharita|thaneswar|valabhi|gauda|shashanka|nalanda"),
 ("Early medieval dynasties (Rajputs, Palas, Rashtrakutas, Chalukyas, Pallavas, Cholas)", r"rajput|pratihar|\bpala\b|\bpalas\b|\bsena\b|rashtrakut|chalukya|pallava|chola|hoysala|kakatiya|yadava|paramara|chauhan|chandela|gahadavala|solanki|rajaraja|rajendra|mahabalipuram|pulakesin|kailasa|amoghavarsha|gurjara|tripartite|nandivarman|narasimhavarman"),
 ("Arab & Turkish invasions and the Slave dynasty", r"mahmud|ghazni|ghur|muhammad ghori|tarain|qutb-ud|qutbuddin|aibak|iltutmish|razia|balban|\barab|muhammad bin qasim|slave dynasty|mamluk|chengiz|chingiz|mongol|ilbari"),
 ("Delhi Sultanate: Khalji, Tughlaq, Sayyid & Lodi", r"khalji|khilji|alauddin|tughlaq|tughluq|firoz|muhammad bin|sayyid|\blodi|sikandar lodi|market reform|token currency|timur|delhi sultan|ibrahim lodi|jalaluddin|ghiyasuddin|malik kafur"),
 ("Vijayanagara, Bahmani & regional kingdoms", r"vijayanagar|krishnadevaraya|harihara|\bbukka|bahmani|gulbarga|bidar|golconda|bijapur|ahmednagar|deccan sultan|kashmir|zainul|gujarat sultan|jaunpur|bengal sultan|malwa|khandesh|ahom|kamarupa|ala-ud-din hasan|mahmud gawan|amuktamalyada|tuluva|aravidu|saluva|virupaksha|hampi"),
 ("Bhakti & Sufi movements", r"bhakti|sufi|kabir|nanak|chaitanya|mirabai|chishti|suhrawardi|ramanuja|shankaracharya|alvar|nayanar|tukaram|namdev|ramananda|\bdadu|surdas|tulsidas|basava|lingayat|madhva|nizamuddin|moinuddin|baba farid|sant|dnyaneshwar"),
 ("Mughal Empire", r"babur|humayun|akbar|jahangir|shah jahan|aurangzeb|mughal|panipat|haldighati|mansabdari|todar mal|jizya|din-i|fatehpur|sher shah|sur dynasty|rupiya|dara shikoh|nur jahan|bairam khan|zabt|khanwa"),
 ("Marathas, Sikhs & Rajput resistance", r"maratha|shivaji|peshwa|sambhaji|baji rao|sikh|ranjit singh|\bguru\b|khalsa|maharana|pratap|chhatrapati|swaraj|chauth|sardeshmukh|ashtapradhan|tarabai|shahu"),
 ("Medieval administration, economy & society", r"iqta|jagir|khalisa|diwan|\bmansab|currency|\btanka|trade|guild|village|caste|slave|taxation|land revenue|market control|karkhana|administration|postal|dagh|police|military|army"),
 ("Art & architecture (ancient and medieval)", r"architect|temple|sculpture|painting|minar|\bfort\b|mosque|tomb|gopuram|nagara|dravida|vesara|mural|cave|ajanta|ellora|khajuraho|konark|taj mahal|qutub minar|red fort|indo-islamic|miniature|school of painting|amaravati|monument|dome|arch|stupa architecture|rock-cut|carving|music|dance|raga|sitar|tabla|kathak"),
 ("Literature, inscriptions, coins & foreign travellers", r"literature|\bauthor|written by|\bbook\b|inscription|script|brahmi|kharosthi|\bcoin|travell?er|ibn battuta|al-?beruni|marco polo|abdur razzaq|nicolo|barbosa|\bpoet|kalhana|rajatarangini|\bplay\b|drama|\bkavi|epigraph|numismatic|edict language|sanskrit|prakrit|persian work|chronicle|historian|treatise|composed"),
],
"gs-modern-india": [
 ("Advent of Europeans in India", r"portuguese|dutch|danish|french|east india company|vasco|albuquerque|dupleix|pondicherry|bombay|surat|factory|trading compan|anglo-french|francisco de almeida|goa|farman|cartaz|swally"),
 ("British conquest & expansion (Plassey to the Sikh wars)", r"plassey|buxar|mysore war|tipu|haidar|anglo-maratha|anglo-sikh|anglo-burmese|anglo-afghan|nepal war|carnatic war|subsidiary alliance|doctrine of lapse|\bclive|treaty of|annex|\bsind\b|siraj|mir jafar|mir qasim|wandiwash|seringapatam|bassein|gurkha|sagauli|pindari"),
 ("Governors-General & Viceroys", r"governor.?general|viceroy|warren hastings|cornwallis|wellesley|bentinck|dalhousie|\bcanning|lytton|ripon|curzon|\bminto|hardinge|chelmsford|\birwin|linlithgow|wavell|mountbatten|auckland|lord \w+|ellenborough|hastings|elgin|northbrook|dufferin|lansdowne|reading|willingdon"),
 ("Constitutional developments (1773–1947)", r"regulating act|pitt|charter act|government of india act|morley|minto-morley|montagu|simon commission|nehru report|communal award|\bcripps|cabinet mission|independence act|august offer|council act|dyarchy|\b1935\b|\b1919\b|\b1909\b|\b1892\b|\b1861\b|round table|wavell plan|cr formula|desai|act of 1|federation|provincial autonomy|shimla conference|simla conference"),
 ("Revolt of 1857", r"\b1857\b|sepoy|mangal pandey|nana sahib|rani laxmi|lakshmibai|tatya tope|mutiny|kunwar singh|bahadur shah|hazrat mahal|enfield|great revolt|first war of independence|azimullah|maulvi ahmadullah|kanpur|lucknow siege"),
 ("Socio-religious reform movements", r"brahmo|arya samaj|ramakrishna|vivekananda|prarthana|aligarh|theosoph|raja ram mohan|dayanand|satyashodhak|young bengal|derozio|vidyasagar|deoband|ahmadiya|narayana guru|singh sabha|self-respect|periyar|veda samaj|annie besant|reform movement|sayyid ahmad|syed ahmad|wahabi|servants of india|ramakrishna mission|jyotiba|phule|kandukuri|veeresalingam|brahmo samaj|keshab"),
 ("Women, social legislation & social reform laws", r"widow remarriage|child marriage|sarda act|age of consent|\bsati\b|purdah|women education|social legislation|female infanticide|devadasi|abolition|hindu widows|special marriage|polygamy|untouchab|temple entry|depressed class"),
 ("British economic policy & its impact", r"drain of wealth|permanent settlement|ryotwari|mahalwari|famine|railway|zamindar|land revenue|deindustriali|handicraft|indigo|opium|commercialisation|tariff|textile|jute mill|steel|\btata\b|economic nationalism|economic policy|industrial|drain|salt tax|plantation|cotton mill|swadeshi industry"),
 ("Education, press, law & administration under the British", r"macaulay|wood.?s despatch|hunter commission|sadler|education|press act|vernacular press|newspaper act|civil service|police|judiciary|\bcode\b|regulation|army|survey|census|local self|municipal|\bcourt\b|high court|supreme court|bureaucracy|lee commission|aitchison|indian councils"),
 ("Peasant, tribal & early uprisings", r"santhal|munda|birsa|\bkol\b|\bho\b|rampa|indigo revolt|deccan riot|moplah|mappila|pabna|bardoli|tebhaga|telangana|\beka\b|tribal|sanyasi|fakir|kuka|pagal panthi|velu thampi|polygar|kittur|bhil|khond|khasi|ahom revolt|diwan bahadur|peasant|kisan|champaran|kheda"),
 ("Rise of nationalism & the Indian National Congress (1885–1905)", r"indian national congress|moderate|extremist|surendranath|dadabhai|gokhale|ranade|bipin chandra|lal bal pal|\btilak|hume|congress session|partition of bengal|swadeshi|boycott|surat split|muslim league|\b1905\b|indian association|bombay presidency association|madras mahajana|wedderburn|bonnerjee|early congress|presidents? of"),
 ("Home Rule, Lucknow Pact & Gandhi's early phase", r"home rule|lucknow pact|ahmedabad mill|rowlatt|jallianwala|khilafat|non-?cooperation|chauri chaura|swarajist|swaraj party|hunter committee|satyagraha sabha|early gandhi|champaran satyagraha|kheda satyagraha"),
 ("Civil Disobedience & Round Table Conferences", r"civil disobedience|dandi|salt march|salt satyagraha|round table|gandhi-irwin|poona pact|communal award|purna swaraj|lahore session|dharasana|bardoli satyagraha|nehru report|simon go back|wavell|1930"),
 ("Quit India Movement & the INA", r"quit india|august offer|azad hind|\bina\b|subhas|bose|rash behari|direct action|naval mutiny|ina trial|1942|cripps mission|do or die|individual satyagraha|forward bloc|red fort trial"),
 ("Revolutionary movement & Left politics", r"bhagat singh|chandrashekhar|hsra|hindustan socialist|ghadar|anushilan|jugantar|komagata|kakori|chittagong|surya sen|khudiram|savarkar|abhinav bharat|communist|socialist|\bml roy|kisan sabha|aituc|trade union|revolutionary|lala hardayal|sachindra|bhagwati|rajguru|sukhdev|batukeshwar|alipore|bomb"),
 ("Communal politics, Partition & integration of princely states", r"partition|jinnah|pakistan|two-nation|mountbatten|boundary|radcliffe|interim government|constituent assembly|princely|integration|sardar patel|vp menon|v\.p\. menon|junagadh|hyderabad|\b1947\b|dominion|direct action day|mountbatten plan|states reorganis|goa liberation|annexation of sikkim"),
 ("Books, journals, newspapers & organisations", r"newspaper|journal|\bbook\b|\bauthor|\bwrote|written by|published|weekly|\bdaily|\beditor|\bpress\b|magazine|publication|autobiography|novel|\bpaper\b|brought out|started the"),
 ("Personalities of the freedom struggle", r"gandhi|nehru|patel|ambedkar|\bazad\b|rajendra prasad|tagore|rajagopalachari|sarojini|aruna asaf|lajpat rai|gokhale|jinnah|tilak|bose|aurobindo|malaviya|vallabhbhai|ghaffar|badshah khan|frontier gandhi|periyar|kasturba|sardar|first president|first woman|president of|presided|drafting committee|leader|nickname|known as"),
],
"gs-geography": [
 ("Universe & Solar System", r"universe|big bang|galaxy|solar system|planet|\bmoon\b|\bsun\b|\bstar\b|comet|asteroid|eclipse|mercury|venus|\bmars\b|jupiter|saturn|uranus|neptune|orbit|milky way|meteor|light year|equinox|solstice|rotation|revolution"),
 ("Earth: interior, rocks & minerals", r"interior|\bcrust|mantle|\bcore\b|\brock|igneous|sedimentary|metamorphic|mineral|lithosphere|geological|\bera\b|fossil|barysphere|asthenosphere|moho|discontinuity|granite|basalt"),
 ("Plate tectonics, earthquakes & volcanoes", r"plate|tectonic|earthquake|volcano|seismic|richter|tsunami|continental drift|\bfault|\bfold|ring of fire|epicentre|focus|lava|magma|geyser|pangaea|wegener|seafloor"),
 ("Geomorphology & landforms", r"weathering|erosion|glacier|\bdune|river valley|waterfall|\bdelta|meander|\bcave|karst|landform|plateau|mountain|peneplain|cycle of erosion|moraine|loess|ox-?bow|canyon|gorge|escarpment|batholith|stalactite|barchan|aeolian|fjord|cirque"),
 ("Atmosphere, pressure belts & winds", r"atmosphere|troposphere|stratosphere|ozone|insolation|heat budget|\bpressure|\bwind|trade wind|westerlies|jet stream|cyclone|anticyclone|humidity|\bcloud|precipitation|\bfront\b|isotherm|mesosphere|ionosphere|lapse rate|albedo|coriolis|dew|fog|condensation"),
 ("World climate, biomes & vegetation", r"koppen|equatorial|savanna|steppe|mediterranean|tundra|taiga|biome|desert climate|natural vegetation|grassland|prairie|pampas|veld|downs|rainforest|climate of|temperate|polar|selvas|llanos"),
 ("Oceans: relief, currents, tides & coral", r"ocean|\bsea\b|\bcurrent|\btide|salinity|coral|continental shelf|trench|gulf stream|el nino|la nina|atoll|\bstrait|\bbay\b|\bgulf\b|sargasso|continental slope|abyssal|mid-?atlantic|benguela|humboldt|kuroshio"),
 ("Latitude, longitude, time & maps", r"latitude|longitude|time zone|\bgmt\b|\bist\b|date line|\bmap\b|\bscale|projection|tropic|equator|standard time|meridian|topograph|contour|cartograph|gis|remote sensing|gps"),
 ("World geography: continents, countries & regions", r"africa|\basia\b|europe|america|australia|antarctic|arctic|\bcountry|capital of|\bnile\b|amazon|sahara|congo|danube|mississippi|andes|alps|rockies|himalay.* nepal|\bnepal|bhutan|sri lanka|myanmar|china|japan|russia|brazil|world|continent|largest .* in the world|currency of|city of|port of|international boundary|line of|boundary between"),
 ("India: location, boundaries & states", r"location|\bboundary|\bborder|\bstate\b|union territor|\bcapital|district|\barea\b|neighbour|radcliffe|durand|mcmahon|frontier|extreme|standard meridian|southernmost|northernmost|indira point|kanyakumari|longest coastline|smallest state|largest state|reorgani[sz]ation"),
 ("India: Himalayas, plains, plateaus, coasts & islands", r"himalaya|siwalik|shivalik|\bplain|bhabar|terai|deccan|\bplateau|western ghats|eastern ghats|\bcoast|\bisland|andaman|lakshadweep|\bpass\b|\bpeak|doab|malwa|chotanagpur|aravalli|vindhya|satpura|nilgiri|karakoram|ladakh|zanskar|kangchenjunga|nanda devi|everest|k2|godwin|anamudi|doddabetta|physiograph|bhangar|khadar|konkan|coromandel"),
 ("Indian rivers, lakes & drainage", r"\briver|tributary|ganga|ganges|yamuna|brahmaputra|godavari|krishna|kaveri|cauvery|narmada|\btapi|mahanadi|\bindus\b|drainage|\bbasin|\blake|waterfall|\bdelta|estuary|chilika|wular|sambhar|pulicat|jhelum|chenab|ravi|beas|sutlej|\bsone\b|kosi|gandak|ghaghara|luni|periyar|tungabhadra"),
 ("Indian climate & monsoon", r"monsoon|rainfall|western disturbance|\bloo\b|\bseason|el nino|mango shower|norwester|kalbaishakhi|retreating|climate of india|temperature|cherrapunji|mawsynram|jet stream|cold wave|tropical cyclone|bay of bengal depression"),
 ("Natural vegetation, forests & wildlife", r"\bforest|vegetation|mangrove|\bsal\b|teak|wildlife|national park|sanctuary|biosphere|tiger|project tiger|species|biodiversity|wetland|ramsar|elephant|rhino|lion|crocodile|sunderban|kaziranga|gir|corbett|\bflora|\bfauna|hotspot|conservation"),
 ("Soils of India", r"\bsoil|alluvial|black soil|regur|laterite|red soil|erosion|desert soil|saline|peaty|podzol|humus|khadar|bhangar|\bicar\b|soil conservation|leaching"),
 ("Agriculture & crops of India", r"\bcrop|agricultur|\brice\b|\bwheat|cotton|sugarcane|\btea\b|coffee|rubber|jute|millet|pulse|kharif|\brabi|zaid|green revolution|horticulture|plantation|farming|cultivation|oilseed|groundnut|tobacco|spices|maize|jowar|bajra|white revolution|blue revolution|shifting cultivation|jhum|mixed farming"),
 ("Irrigation, dams & multipurpose projects", r"irrigation|\bcanal|\btank\b|\bwell\b|\bdam\b|multipurpose|project|barrage|reservoir|hirakud|bhakra|nagarjuna|tehri|sardar sarovar|farakka|damodar|tungabhadra|rihand|indira gandhi canal|command area"),
 ("Minerals, power & energy resources", r"\bcoal|iron ore|mineral|manganese|bauxite|copper|\bmica|petroleum|\boil\b|natural gas|uranium|thorium|power plant|hydel|thermal|nuclear|solar|wind energy|geothermal|\benergy|\bmining|refinery|lignite|\bgold|\bzinc|monazite|ilmenite|limestone|\btin\b|\blead\b"),
 ("Industries of India", r"\bindustr|steel|cotton textile|jute|sugar|cement|fertili|paper|aluminium|automobile|software|iron and steel|industrial region|\bsez\b|manufactur|tata iron|bhilai|rourkela|bokaro|salem|vizag steel|textile|chemical industry|petrochemical|silk"),
 ("Transport, ports & trade", r"railway|highway|\bnh\b|\bport\b|airport|waterway|pipeline|\btrade|export|import|metro|\broad|zone|express|national highway|golden quadrilateral|major port|kandla|mumbai port|jnpt|paradip|tuticorin|ennore|haldia|air india|dfc|corridor|konkan railway"),
 ("Population, census, tribes & urbanisation", r"census|population|literacy|\bdensity|sex ratio|\burban|\bcity|migration|\btribe|language|religion|scheduled caste|growth rate|demograph|million plus|metropolitan|human development|life expectancy|birth rate|death rate|fertility"),
 ("Andhra Pradesh geography", r"andhra|\bap\b|rayalaseema|nallamala|visakhapatnam|vizag|tirupati|amaravati|srisailam|\bkrishna district|guntur|kurnool|anantapur|chittoor|nellore|prakasam|kadapa|east godavari|west godavari|srikakulam|vizianagaram|kolleru|kondapalli|araku|papikonda|horsley"),
],
"gs-environment": [
 ("Ecology basics: ecosystem, food chain & energy flow", r"ecosystem|food chain|food web|trophic|ecological pyramid|energy flow|producer|consumer|decompos|biome|ecotone|niche|habitat|\bbiotic|abiotic|ecology|population|succession|symbiosis|mutualism|commensal|parasit|predat|keystone|biogeochemical|nitrogen cycle|carbon cycle"),
 ("Biodiversity, hotspots & species", r"biodiversity|hotspot|endemic|\bspecies|endangered|extinct|red data|\biucn|critically|vulnerable|flora|fauna|invasive|alien|megadiversity|genetic diversity|ex-?situ|in-?situ|gene bank|zoo\b"),
 ("Protected areas: national parks, sanctuaries & reserves", r"national park|sanctuary|biosphere reserve|tiger reserve|elephant reserve|ramsar|wetland|world heritage|conservation reserve|community reserve|project tiger|project elephant|mangrove|coral|protected area|\bunesco"),
 ("Forests, wildlife & conservation movements", r"\bforest|wildlife|chipko|appiko|silent valley|narmada bachao|joint forest|tree\b|deforest|afforest|social forestry|agroforestry|\bcites\b|poaching|\btiger|\bleopard|\blion\b|rhino|vulture|crocodile|elephant"),
 ("Air, water, soil & noise pollution", r"pollut|\bsmog|particulate|\bpm ?2\.5|\bpm ?10|\bsox\b|\bnox\b|aqi|air quality|\bbod\b|\bcod\b|eutrophic|algal bloom|acid rain|noise|decibel|\bsoil|erosion|salinity|heavy metal|arsenic|fluoride|groundwater|effluent|sewage"),
 ("Solid waste, e-waste & hazardous waste", r"\bwaste|e-?waste|plastic|landfill|incinerat|compost|recycl|hazardous|biomedical|radioactive waste|swachh|segregat|sanitation|microplastic"),
 ("Climate change, ozone & global warming", r"climate|global warming|greenhouse|\bozone|\bcfc|montreal|kyoto|paris agreement|carbon credit|carbon footprint|carbon neutral|net zero|\bunfccc|\bcop\b|\bipcc|el nino|la nina|sea level|glacier|\bndc\b|carbon sink|\bredd"),
 ("Energy: renewable & non-renewable", r"renewable|solar|\bwind\b|hydro|geothermal|biofuel|biogas|biomass|\bcoal\b|nuclear|tidal|\bethanol|green hydrogen|\bhydrogen|fossil|energy|\bfuel|electric vehicle|\bev\b"),
 ("Environmental laws, policies & institutions", r"\bact\b|\bngt\b|national green tribunal|\bmoef|\bcpcb|\bspcb|\bpolicy|\bnap\b|\beia\b|environment impact|notification|tribunal|legislation|article 48|article 51|\brules\b|\bcommittee|\bcommission"),
 ("International conventions, treaties & organisations", r"convention|protocol|treaty|\bcbd\b|cartagena|nagoya|basel|rotterdam|stockholm|minamata|\bcites\b|ramsar|\bunep|\bundp\b|\bgef\b|\bwwf\b|\bsdg|earth summit|world environment day|\bunccd|bonn|solar alliance"),
 ("Agriculture, sustainable development & resources", r"sustainable|organic farming|agricultur|\bcrop|pesticide|fertili[sz]er|biofertili|green revolution|irrigation|watershed|rainwater|water conservation|\bresource|zero budget|\bgm\b|genetically|bioremediation|permaculture"),
 ("Environmental issues, disasters & current affairs", r"disaster|flood|cyclone|earthquake|tsunami|drought|landslide|\bndma\b|oil spill|bhopal|chernobyl|fukushima|wildfire|\bindex\b|\breport\b|\bsurvey|initiative|mission|campaign|programme|scheme"),
],
"gs-science-tech": [
 ("Physics: units, motion & force", r"\bunit\b|measurement|velocity|\bspeed|acceleration|newton|inertia|momentum|friction|projectile|circular motion|vector|scalar|dimension|\bsi\b|distance|displacement|centripetal|centrifugal|equation of motion|physical quantit"),
 ("Physics: gravitation, pressure & fluids", r"gravit|escape velocity|satellite orbit|kepler|\bpressure|buoyan|archimedes|pascal|density|viscosity|surface tension|bernoulli|capillar|barometer|floating|sinks|relative density|hydrometer|hydraulic|\bg\b value"),
 ("Physics: work, energy & power", r"\bwork\b|\benergy|\bpower\b|kinetic|potential energy|machine|lever|efficiency|\bwatt|\bjoule|conservation of energy|pulley|inclined plane|horse power|horsepower"),
 ("Physics: heat & thermodynamics", r"\bheat|temperature|thermometer|calorie|specific heat|latent|expansion|conduction|convection|radiation|thermodynamic|kelvin|celsius|fahrenheit|boiling|melting|calorimeter|thermal|absolute zero|thermos"),
 ("Physics: sound & waves", r"\bsound|\bwave|frequency|\becho|ultrasound|\bpitch|loudness|decibel|doppler|resonance|vibration|amplitude|\bmach\b|infrasonic|sonar|reverberation|timbre|wavelength|transverse|longitudinal"),
 ("Physics: light & optics", r"\blight\b|\blens|mirror|refraction|reflection|spectrum|rainbow|prism|myopia|hypermetropia|\bcolou?r|laser|polari[sz]ation|dispersion|diffraction|telescope|microscope|optical fibre|total internal|mirage|twinkl|scattering|focal|camera|photograph"),
 ("Physics: electricity & magnetism", r"electric|\bcurrent\b|resistance|voltage|\bohm|circuit|battery|transformer|capacitor|\bfuse|magnet|electromagnet|generator|\bmotor\b|conductor|insulator|semiconductor|diode|transistor|\bac\b|\bdc\b|ammeter|voltmeter|galvanometer|coulomb|\bvolt\b|ampere|cell\b.*electro|dynamo|inductor"),
 ("Physics: modern physics, atom & nuclear", r"\batom|nucleus|nuclear|radioactiv|fission|fusion|x-?ray|photoelectric|quantum|electron|proton|neutron|cathode|bohr|rutherford|einstein|half life|geiger|chain reaction|alpha|beta|gamma|plasma|superconduct|hadron|boson|higgs"),
 ("Chemistry: matter, atoms & molecules", r"\bmatter|\bmolecule|\belement|nitrogen|hydrogen|oxygen|chlorine|\bsulphur|phosphorus|isotope|isobar|valency|electron configuration|\bmole\b|atomic mass|state of matter|\bsolid|\bliquid|\bgas\b|mixture|compound|separation|distillation|filtration|sublimation|atomic number|symbol of|chromatograph|crystalli|evaporation"),
 ("Chemistry: periodic table & chemical bonding", r"periodic|\bgroup\b|\bperiod\b|alkali|halogen|noble gas|\bbond|ionic|covalent|electronegativ|transition element|mendeleev|metalloid|lanthanide|actinide|inert gas"),
 ("Chemistry: acids, bases & salts", r"\bacid|\bbase\b|\bsalt\b|\bph\b|indicator|litmus|neutral|antacid|baking soda|washing soda|bleaching|plaster of paris|alkali|hcl|h2so4|sulphuric|nitric|citric|lactic|tartaric|formic|acetic"),
 ("Chemistry: metals, non-metals & alloys", r"\bmetal|non-?metal|alloy|\bsteel|brass|bronze|corrosion|\brust|galvaniz|\bore\b|extraction|amalgam|noble metal|mercury|\bgold\b|\bsilver|copper|aluminium|\biron\b|zinc|\btin\b|sodium|potassium|magnesium|calcium"),
 ("Chemistry: carbon & organic compounds", r"\bcarbon|organic|hydrocarbon|alkane|alkene|alkyne|alcohol|ethanol|methane|ethane|acetylene|benzene|vinegar|formaldehyde|chloroform|\blpg\b|\bcng\b|petroleum|natural gas|diamond|graphite|fullerene|\bfuel|methanol|glucose|sugar|starch|cellulose|isomer|functional group"),
 ("Chemistry: polymers, plastics & everyday chemistry", r"polymer|plastic|nylon|polythene|\bpvc\b|teflon|\brubber|bakelite|soap|detergent|fertili[sz]er|pesticide|\bglass|\bcement|\bdye|paint|explosive|\btnt\b|\bpaper|\bfibre|textile|preservative|food additive|cosmetic|medicine|drug|antiseptic|disinfectant|cleaning|freon|refrigerant|glazing|pottery|ceramic"),
 ("Chemistry: reactions, gases & solutions", r"reaction|oxidation|reduction|redox|combustion|catalyst|electrolysis|solution|colloid|gas law|boyle|charles law|avogadro|chemical equation|endothermic|exothermic|solubility|saturated|dilute|concentrat|rate of|equilibrium|precipitat|displacement"),
 ("Biology: cell & cell division", r"\bcell\b|\bcells\b|nucleus|mitochondri|ribosome|organelle|chromosome|mitosis|meiosis|cell wall|plasma membrane|prokaryot|eukaryot|golgi|lysosome|vacuole|chloroplast|endoplasmic|cytoplasm|protoplasm"),
 ("Biology: genetics, heredity & evolution", r"\bgene\b|\bgenes\b|\bdna\b|\brna\b|heredity|mendel|evolution|darwin|lamarck|mutation|genetic|blood group|inheritance|genome|natural selection|allele|karyotype|down syndrome|turner|klinefelter|sex determination|hereditary|human genome"),
 ("Biology: plant science (botany)", r"\bplant|photosynth|\bleaf|\broot|\bstem\b|flower|\bseed|\bfruit|pollination|germination|transpiration|auxin|chlorophyll|xylem|phloem|\btissue|botany|\bfungi|fungus|\balgae|bryophyte|pteridophyte|gymnosperm|angiosperm|monocot|dicot|stomata|respiration in plants|plant hormone|gibberellin|cytokinin|ethylene"),
 ("Biology: classification & animal kingdom", r"classification|kingdom|taxonomy|\bspecies\b|phylum|mammal|reptile|amphibian|\bbird|\bfish|insect|invertebrate|vertebrate|zoology|binomial|\banimal|protozoa|arthropod|mollusc|annelid|echinoderm|porifera|coelenterate|nematode|worm|\bbat\b|whale|dolphin|snake"),
 ("Human body: digestive, respiratory & circulatory systems", r"digest|stomach|intestine|\bliver|pancreas|\bbile|\benzyme|saliva|respir|\blung|breath|\bheart|\bblood\b|artery|\bvein|\bpulse|platelet|\brbc\b|\bwbc\b|haemoglobin|hemoglobin|circulat|blood pressure|lymph|plasma|oesophagus|diaphragm|alveoli|valves"),
 ("Human body: nervous, endocrine & excretory systems, skeleton & senses", r"\bbrain|\bnerve|neuron|reflex|hormone|\bgland|thyroid|insulin|pituitary|adrenal|\bkidney|\burine|nephron|dialysis|skeleton|\bbone|muscle|\bskin\b|\beye\b|\bear\b|sense organ|spinal cord|cerebr|hypothalam|testes|ovary|reproduct|menstrual|embryo|pregnan|fertili[sz]ation|puberty"),
 ("Nutrition, vitamins & deficiency diseases", r"vitamin|protein|carbohydrate|\bfat\b|\bfats\b|nutrition|deficiency|scurvy|rickets|beriberi|anaemia|anemia|goitre|kwashiorkor|marasmus|balanced diet|obesity|calorie|night blindness|pellagra|iodine|\biron deficiency|diet|nutrient|trace element"),
 ("Diseases, immunity & public health", r"\bdisease|virus|bacteria|vaccine|antibiotic|cancer|diabetes|malaria|tuberculosis|\baids\b|\bhiv\b|cholera|typhoid|dengue|covid|immun|pathogen|epidemic|pandemic|\bwho\b|first aid|antibody|measles|polio|hepatitis|leprosy|plague|rabies|chikungunya|vector|infect|communicable|syndrome"),
 ("Biotechnology & genetic engineering", r"biotechnology|genetic engineering|gm crop|bt cotton|tissue culture|cloning|stem cell|dna fingerprint|\bpcr\b|recombinant|transgenic|crispr|genetically modified|bt brinjal|golden rice|hybrid|biofertili|biopesticide|dolly|test tube|ivf|gene therapy|insulin production"),
 ("Ecology, environment & natural resources (science)", r"ecosystem|food chain|pollut|\bozone|greenhouse|biodiversity|wildlife|global warming|renewable|\bwaste|acid rain|ecology|\bpest|climate change|conservation|endangered|extinct|red data|ramsar|forest|carbon footprint|smog|eutrophication"),
 ("Space technology & ISRO", r"\bisro|satellite|rocket|launch|chandrayaan|mangalyaan|\bgslv|\bpslv|vikram sarabhai|aditya|\bspace|gaganyaan|cartosat|insat|navic|irnss|nasa|astronaut|cosmonaut|space station|telescope|hubble|mars orbiter|lunar|sriharikota|orbit"),
 ("Defence technology & missiles", r"missile|\bdrdo\b|\bagni\b|prithvi|brahmos|\bakash|tejas|arihant|\bins\b|aircraft carrier|torpedo|submarine|defence|\bnag\b|\bastra\b|radar|\btank\b|\barjun\b|fighter|warship|\bwar\b|armed forces|ballistic|cruise|kalam|pokhran|\bmbt\b"),
 ("Computers, IT & communication", r"computer|internet|software|digital|cyber|robot|artificial intelligence|\b5g\b|\b4g\b|mobile phone|aadhaar|hardware|\bmemory|\bcpu\b|binary|\bnetwork|e-?mail|\bwww\b|\bbit\b|\bbyte|social media|operating system|\bram\b|\brom\b|\bweb\b|google|\bsearch engine|bluetooth|wi-?fi|\bapp\b|blockchain|data|programming|virus \(computer"),
 ("Inventions, discoveries, scientists & institutions", r"invent|discover|scientist|nobel|\baward|institution|research|laborator|\bcsir\b|national physical|bhabha|\braman\b|chandrasekhar|sarabhai|science day|first to|founder of|father of|credited|first indian|medal|prize|patent|iit|institute"),
],
}

# Broad catch-all chapters need more evidence than the specific ones, otherwise they swallow everything.
BROAD = {"Books, journals, newspapers & organisations", "Personalities of the freedom struggle", "Medieval administration, economy & society", "Literature, inscriptions, coins & foreign travellers",
         "World geography: continents, countries & regions", "India: location, boundaries & states", "Inventions, discoveries, scientists & institutions", "Education, press, law & administration under the British",
         "Art & architecture (ancient and medieval)", "Computers, IT & communication", "Ecology, environment & natural resources (science)", "Environmental laws, policies & institutions", "Environmental issues, disasters & current affairs", "Energy: renewable & non-renewable", "Agriculture, sustainable development & resources", "International conventions, treaties & organisations", "Minerals, power & energy resources", "Transport, ports & trade"}

def score(text_q, text_o, text_e, pats):
    out = []
    for name, rx in pats:
        r = re.compile(rx, re.I)
        s = 2 * len(r.findall(text_q)) + len(r.findall(text_o)) + len(r.findall(text_e))
        out.append(s * (0.6 if name in BROAD else 1.0))
    return out

FILES = {"gs-ancient-medieval": ["gs-ancient-medieval", "gs-ancient-medieval-unverified"], "gs-modern-india": ["gs-modern-india", "gs-modern-india-unverified"],
         "gs-geography": ["gs-geography", "gs-geography-unverified"], "gs-science-tech": ["gs-science-tech", "gs-science-tech-unverified"], "gs-environment": ["gs-environment", "gs-environment-unverified"]}
FALLBACK = {"gs-ancient-medieval": "Ancient & medieval India: other questions", "gs-modern-india": "Modern India: other questions",
            "gs-geography": "Geography: other questions", "gs-science-tech": "General science: other questions", "gs-environment": "Environment: other questions"}

out, report = {}, {}
for book, files in FILES.items():
    pats = T[book]
    cnt = collections.Counter()
    for f in files:
        for q in json.loads((root / "data/questions" / f"{f}.json").read_text("utf8")):
            sc = score(q["question"], " ".join(q["options"]), q.get("explanation") or "", pats)
            best = max(sc)
            topic = pats[sc.index(best)][0] if best >= 1.2 else FALLBACK[book]
            out[q["id"]] = topic
            cnt[topic] += 1
    report[book] = cnt
(root / "data/gs-topics.json").write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n", "utf8")
for book, cnt in report.items():
    tot = sum(cnt.values())
    print(f"== {book}: {tot} questions in {len(cnt)} chapters")
    for t, n in cnt.most_common():
        print(f"   {n:4d}  {t}")
